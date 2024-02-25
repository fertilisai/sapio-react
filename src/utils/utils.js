const data = {
  members: [
    {
      name: "cliff",
      age: "34",
    },
    {
      name: "ted",
      age: "42",
    },
    {
      name: "bob",
      age: "12",
    },
  ],
};

function export2txt(data) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], {
      type: "text/plain",
    })
  );
  a.setAttribute("download", "data.txt");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
