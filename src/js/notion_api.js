import axios from 'axios'

export const getPublicPageData = ({space_domain, block_id}) => {
    return axios({
        url: 'https://www.notion.so/api/v3/getPublicPageData',
        method: 'post',
        data: {
            type: "block-space",
            name: "page",
            blockId: block_id,
            spaceDomain: space_domain,
            showMoveTo: false,
            saveParent: false,
            shouldDuplicate: false,
            projectManagementLaunch: false,
            requestedOnPublicDomain: false,
            configureOpenInDesktopApp: false,
            mobileData: {
                "isPush": false
            }
        }
    })
}

export const getBlockFileDownloadUrl = ({block_id, page_id, active_user_id}) => {
    return axios(
        {
          method: 'post',
          url: 'https://www.notion.so/api/v3/getBlockFileDownloadUrl',
          data: {
            blockId: block_id,
            pageBlockId: page_id,
            meta: {
              name: "downloadSource"
            }
          },
          headers: {
            'x-notion-active-user-header': active_user_id
          },
          withCredentials: true,
          maxRedirects: 0
        }
    )
}
