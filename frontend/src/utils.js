export function money(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG');
}
