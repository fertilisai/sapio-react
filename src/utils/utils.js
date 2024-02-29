export default function today() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  // var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  today = mm + "/" + dd;
  // console.log(today);
  return today;
}

// const data = {
//   members: [
//     {
//       name: "cliff",
//       age: "34",
//     },
//     {
//       name: "ted",
//       age: "42",
//     },
//     {
//       name: "bob",
//       age: "12",
//     },
//   ],
// };

// function export2txt(data) {
//   const a = document.createElement("a");
//   a.href = URL.createObjectURL(
//     new Blob([JSON.stringify(data, null, 2)], {
//       type: "text/plain",
//     })
//   );
//   a.setAttribute("download", "data.txt");
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
// }
