let addToast = () => {};

export function setToastHandler(handler) {
  addToast = handler;
}

export function toast(msg, type = 'default') {
  addToast(msg, type);
}
