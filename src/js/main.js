import { inflate } from 'pako'
import axios from 'axios'
import decodePng from 'png-chunks-extract'
import tEXt from 'png-chunk-text'
import * as notion from './notion_api'
import { exportToBlob, exportToSvg } from './excalidraw/bundle.js'
import '../img/icon.png'
import loading_svg from '../img/loading.svg'
import excalidraw_svg from '../img/excalidraw.svg'
import checked_svg from '../img/checked.svg'
import warning_svg from '../img/warning.svg'
import { byteStringToArrayBuffer, getFileName, getPageID, getSpaceDomain, waitMatchedElement } from './utils'

window.EXCALIDRAW_ASSET_PATH = chrome.runtime.getURL('/fonts/')

const extractExcalidrawData = async (text_chunk_text) => {
  const graph_json_decoded = inflate(byteStringToArrayBuffer(JSON.parse(text_chunk_text).encoded), {
    to: 'string'
  })
  const parsed = JSON.parse(graph_json_decoded);
  return parsed
}

const parsePNG = async (data) => {
  const png = decodePng(new Uint8Array(data))
  const text_chunk = png.find(chunk => chunk.name === 'tEXt')
  const { text: text_chunk_text } = tEXt.decode(text_chunk.data)
  const parsed = extractExcalidrawData(text_chunk_text)
  parsed.type = 'excalidraw/clipboard'
  return parsed
}

// example <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 781.011786493091 1074.2135109852106" width="2343.035359479273" height="3222.640532955632"><!-- svg-source:excalidraw --><metadata><!-- payload-type:application/vnd.excalidraw+json --><!-- payload-version:2 --><!-- payload-start -->eyJ2ZXJzaW9uIjoiMSIsImVuY29kaW5nIjoiYnN0cmluZyIsImNvbXByZXNzZWQiOnRydWUsImVuY29kZWQiOiJ4nO19WXdcdTA
const parseSVG = async (data) => {
  const svgString = new TextDecoder().decode(data)
  const svg = new DOMParser().parseFromString(svgString, 'image/svg+xml')
  const meta = svg.querySelector('metadata')
  const text = meta.textContent
  // remove all the comments
  const text_removed_comments = text.replace(/<!--.*?-->/g, '')
  const parsed = extractExcalidrawData(atob(text_removed_comments))
  parsed.type = 'excalidraw/clipboard'
  return parsed
}


const getImageAndCopyToCliboard = async (url) => {
  const result = await axios(
    {
      method: 'get',
      url,
      responseType: 'arraybuffer',
      withCredentials: true
    }
  )

  if (result.headers['content-type'] === 'image/png') {
    const parsed = await parsePNG(result.data)
    navigator.clipboard.writeText(JSON.stringify(parsed))
  } else if (result.headers['content-type'] === 'image/svg+xml') {
    const parsed = await parseSVG(result.data)
    navigator.clipboard.writeText(JSON.stringify(parsed))
  }
};

const setupButton = (img_block) => {
  const buttons = document.evaluate('self::div[contains(@class, "notion-image-block") and count(descendant::div[@excalidraw_copy_button="true"])=0]//div[@role="button"]', img_block, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

  // no need to add button if no matched block
  if (buttons.snapshotLength == 0) {
    return;
  }

  const first_button = buttons.snapshotItem(0);
  const copy_excalidraw_json_button = document.createElement('div');
  for (let attribute of first_button.attributes) {
    copy_excalidraw_json_button.setAttribute(attribute.name, attribute.value);
  }
  copy_excalidraw_json_button.setAttribute("excalidraw_copy_button", "true");
  copy_excalidraw_json_button.innerHTML = excalidraw_svg

  // Insert element
  first_button.insertAdjacentElement('afterend', copy_excalidraw_json_button);

  // Add click listener
  copy_excalidraw_json_button.addEventListener('click', async () => {
    const imgs = document.evaluate("*//img", img_block, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    if (imgs.snapshotLength === 0) {
      return
    }
    const img = imgs.snapshotItem(0);
    const url = img.attributes.src.value;
    const real_url_encoded = url.replace(/^\/image\//, '')
    const real_url = new URL(decodeURIComponent(real_url_encoded));
    real_url.searchParams.delete('width');
    real_url.searchParams.append('download', 'true')
    real_url.searchParams.append('name', getFileName(real_url.pathname))

    const page_id = getPageID(document.location.pathname);
    const space_domain = getSpaceDomain(document.location.pathname);
    let {
      data: {
        ownerUserId
      },
      headers
    } = await notion.getPublicPageData({ space_domain, block_id: getPageID(location.pathname) });
    ownerUserId = ownerUserId || headers['x-notion-user-id']

    // need to try to download the file and get the aws cookie
    const {
      data: {
        url: image_download_url
      }
    } = await notion.getBlockFileDownloadUrl(
      {
        block_id: real_url.searchParams.get('id'),
        page_id,
        active_user_id: ownerUserId
      }
    )

    const signed_url = new URL("https://www.notion.so");
    signed_url.pathname = '/signed/' + encodeURIComponent(image_download_url);
    signed_url.searchParams.append('table', 'block');
    signed_url.searchParams.append('id', real_url.searchParams.get('id'));
    signed_url.searchParams.append('spaceId', real_url.searchParams.get('spaceId'));
    signed_url.searchParams.append('name', getFileName(real_url.pathname));
    signed_url.searchParams.append('download', 'true');
    signed_url.searchParams.append('userId', real_url.searchParams.get('userId'));
    signed_url.searchParams.append('cache', 'v2');



    copy_excalidraw_json_button.innerHTML = loading_svg;
    try {
      await getImageAndCopyToCliboard(signed_url.toString());
      copy_excalidraw_json_button.innerHTML = checked_svg;
    } catch (ex) {
      console.log("Error when get scene data from image", ex);
      copy_excalidraw_json_button.innerHTML = warning_svg;
    } finally {
      setTimeout(() => {
        copy_excalidraw_json_button.innerHTML = excalidraw_svg
      }, 3000)
    }
  })
}

document.addEventListener('readystatechange', async () => {
  if (document.readyState === "complete") {
    const mo = new MutationObserver(mutations => {
      mutations.map(mutation => {
        if (mutation.type === 'childList') {
          if (mutation?.target.matches('.notion-cursor-default')) {
            // Resize the button will trigger this event, so we need to check if we need to add the button back.
            // Check if it is the descendant of notion-image-block using xpath
            const img_blocks = document.evaluate('ancestor::div[contains(@class, "notion-image-block")]', mutation.target, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            if (img_blocks.snapshotLength > 0) {
              setupButton(img_blocks.snapshotItem(0));
            }
          } else {
            const img_blocks = mutation.target.querySelectorAll('.notion-image-block');
            if (img_blocks.length > 0) {
              img_blocks.forEach(setupButton);
            }
          }
        }
      });
    });

    mo.observe(document, {
      childList: true,
      subtree: true,
      attributes: false
    })

    document.addEventListener('paste', async (event) => {
      const text = event.clipboardData?.getData("text/plain")
      if (text?.includes('{"type":"excalidraw/clipboard"')) {
        event.preventDefault();
        event.stopPropagation();
        const parsed = JSON.parse(text);

        // 获取配置的图片质量和格式
        const { scale = 3, embedFormat = 'png' } = await chrome.storage.sync.get();

        const blob = await (async () => {
          if (embedFormat === 'png') {
            return await exportToBlob({
              elements: parsed.elements,
              appState: {
                exportEmbedScene: true,
              },
              quality: 1,
              files: parsed.files,
              getDimensions(width, height) {
                return {
                  width: width * scale,
                  height: height * scale,
                  scale: scale
                }
              },
              mimeType: 'image/png'
            }
            );
          } else if (embedFormat === 'svg') {
            const svg = await exportToSvg({
              elements: parsed.elements,
              appState: {
                exportEmbedScene: true,
              },
              files: parsed.files,
            })
            return svg.outerHTML
          }
        })();

        const file = new File([blob], `image.${embedFormat}`, { type: embedFormat === 'svg' ? 'image/svg+xml' : 'image/png' })

        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)

        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dataTransfer,
        })

        document.dispatchEvent(pasteEvent)
      }
    })
  }
});