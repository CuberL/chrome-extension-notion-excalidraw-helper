
export const byteStringToArrayBuffer = (byteString) => {
    const buffer = new ArrayBuffer(byteString.length);
    const bufferView = new Uint8Array(buffer);
    for (let i = 0, len = byteString.length; i < len; i++) {
        bufferView[i] = byteString.charCodeAt(i);
    }
    return buffer;
};

export const getPageID = (path) => {
    const uuid_without_dashes = getFileName(path).slice(-32);
    // Add back the dashes to uuid
    const uuid = uuid_without_dashes.slice(0, 8) + '-' + uuid_without_dashes.slice(8, 12) + '-' + uuid_without_dashes.slice(12, 16) + '-' + uuid_without_dashes.slice(16, 20) + '-' + uuid_without_dashes.slice(20, 32);
    return uuid;
}

export const getFileName = (path) => {
    const splited = path.split('/')
    return splited[splited.length - 1];
}

export const waitMatchedElement = (base, xpath) => new Promise(resolve => {
    const tmp_mo = new MutationObserver(() => {
        const matched_elems = document.evaluate(xpath, base, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (matched_elems.snapshotLength > 0) {
            resolve(matched_elems.snapshotItem(0));
            tmp_mo.disconnect();
        }
    })
    tmp_mo.observe(base, {
        childList: true,
        subtree: true,
        attributes: true
    });
})