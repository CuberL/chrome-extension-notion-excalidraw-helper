# chrome-extension-notion-excalidraw-helper

[简体中文](README-CN.md)

This is a extension that makes it easy for everyone to use notion and excalidraw together. It can easily copy excalidraw graphics between notion and excalidraw, so that you can easily use the powerful excalidraw to make notion illustrations.

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/K8wZ2NGHT4I/0.jpg)](https://www.youtube.com/watch?v=K8wZ2NGHT4I)

## Installation

### Install from app store

https://chrome.google.com/webstore/detail/notion-x-excalidraw-helpe/fbpnfcemlpcledmlpjmphpkehgokghmg

Just add to chrome and enjoy!

### Unpacked extension

The unpacked extension has been built in the repo. You can directly open the Chrome extension settings page, turn on developer mode, click Load unpacked, and select the build directory in this repo.

![Alt text](doc/image.png)

### Build from source code

If you need to make some improvements to the code, you can choose to build from the code, and it is also very welcome to PR to improve the extension

``` shell
yarn
yarn build
```     

## Usage

The usage of this extension is very simple, there are the following two most basic operations:

### Copy from excalidraw to notion

After the extension is installed, select graphics need to be copied in excalidraw with a selection box, and use the shortcut key to copy them (such as command + C on mac)

![Alt text](doc/image-1.png)

Then paste it into notion, and you can paste the excalidraw graphic into notion in the form of a image. The picture contains the original data of excalidraw, and you can re-import the picture into excalidraw to continue editing.

![Alt text](doc/image-2.png)

### Copy from notion to excalidraw

![Alt text](doc/image-3.png)

For pictures that already contain excalidraw original data, hover over the image block, click the button with the excalidraw logo, and wait until the button becomes √, then you can open excalidraw for pasting, and the original graphics will be pasted back to excalidraw in an editable form, and the original content on the whiteboard will still there. No backup operations are required.

![Alt text](doc/image-4.png)

For viewers who have not installed the extension, it is just an ordinary image on notion, and the viewing will not be affected.

## Why do you need this extension

### Copy from excalidraw to notion

When operating manually, you need to manually export the image to the local disk, and then add an image block to notion, and manually upload the image.

### Copy from notion to excalidraw

When operating manually, you need to manually download the original image from notion to the local disk, and then open the image in excalidraw to import; if there is already content on the excalidraw whiteboard at this time, you need to back up the current data first, otherwise importing the image will cause the current whiteboard data to be lost.

In short, this extension is mainly to reduce the cost of embedding excalidraw graphics in notion and retaining some editing functions.
