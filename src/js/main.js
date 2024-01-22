import { inflate } from 'pako'
import axios from 'axios'
import decodePng from 'png-chunks-extract'
import tEXt from 'png-chunk-text'
import * as notion from './notion_api'
import { exportToBlob } from '@excalidraw/excalidraw'
import '../img/icon.png'
import loading_svg from '../img/loading.svg'
import excalidraw_svg from '../img/excalidraw.svg'
import checked_svg from '../img/checked.svg'
import warning_svg from '../img/warning.svg'
import { byteStringToArrayBuffer, getFileName, getPageID, getSpaceDomain, waitMatchedElement } from './utils'

const getImageAndCopyToCliboard = async (url) => {
  const result = await axios(
    {
      method: 'get',
      url,
      responseType: 'arraybuffer',
      withCredentials: true
    }
  )

  const png = decodePng(new Uint8Array(result.data))
  const text_chunk = png.find(chunk => chunk.name === 'tEXt')
  const { text: text_chunk_text } = tEXt.decode(text_chunk.data)
  const graph_json_encoded = inflate(byteStringToArrayBuffer(JSON.parse(text_chunk_text).encoded), {
    to: 'string'
  })
  const parsed = JSON.parse(graph_json_encoded);
  parsed.type = 'excalidraw/clipboard'
  navigator.clipboard.writeText(JSON.stringify(parsed))
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

    const signed_url = new URL("https://www.notion.so");
    signed_url.pathname = '/signed/' + encodeURIComponent(real_url.origin + real_url.pathname);
    signed_url.searchParams.append('table', 'block');
    signed_url.searchParams.append('id', real_url.searchParams.get('id'));
    signed_url.searchParams.append('spaceId', real_url.searchParams.get('spaceId'));
    signed_url.searchParams.append('name', getFileName(real_url.pathname));
    signed_url.searchParams.append('download', 'true');
    signed_url.searchParams.append('userId', real_url.searchParams.get('userId'));
    signed_url.searchParams.append('cache', 'v2');

    const page_id = getPageID(document.location.pathname);
    const space_domain = getSpaceDomain(document.location.pathname);
    let {
      data: {
        ownerUserId
      },
      headers
    } = await notion.getPublicPageData({space_domain, block_id: getPageID(location.pathname)});

    ownerUserId = ownerUserId || headers['x-notion-user-id']

    // need to try to download the file and get the aws cookie
    await notion.getBlockFileDownloadUrl(
      {
        block_id: real_url.searchParams.get('id'),
        page_id,
        active_user_id: ownerUserId
      }
    )
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

    const cascadia_font = new FontFace(
      'Cascadia',
      `url(${(chrome.runtime.getURL("@excalidraw/excalidraw@0.16.1/dist/excalidraw-assets/Cascadia.woff2"))})`,
    );
    await cascadia_font.load();

    const virgil_font = new FontFace(
      'Virgil',
      `url(${(chrome.runtime.getURL("@excalidraw/excalidraw@0.16.1/dist/excalidraw-assets/Virgil.woff2"))})`,
    );
    await virgil_font.load();

    document.fonts.add(cascadia_font);
    document.fonts.add(virgil_font);

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
        const blob = await exportToBlob(
          {
            elements: parsed.elements,
            appState: {
              exportEmbedScene: true,
            },
            quality: 1,
            files: parsed.files,
            getDimensions(width, height) {
              return {
                width: width * 3,
                height: height * 3,
                scale: 3
              }
            },
            mimeType: 'image/png',
          }
        )

        const file = new File([blob], 'image.png', { type: 'image/png' })

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