export default function today() {
  const date = new Date();
  let dd = date.getDate();
  let mm = date.getMonth() + 1;
  
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  
  return `${mm}/${dd}`;
}
