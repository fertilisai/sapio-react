// import DOMPurify from "dompurify";
// import { marked } from "marked";
// import highlight from "../assets/harmonic16-dark.min.css";
// import highlight from "../assets/harmonic16-light.min.css";
export default function MsgAssistant(props) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(props.content);
    } catch (err) {
      console.error("Failed to copy content to clipboard", err);
    }
  };

  return (
    <div className="flex bg-slate-100 px-4 py-8 dark:bg-slate-900 sm:px-6">
      <img
        className="mr-2 flex h-8 w-8 rounded-full sm:mr-4"
        src="https://dummyimage.com/256x256/354ea1/ffffff&text=A"
      />

      <div className="flex w-full flex-col items-start lg:flex-row lg:justify-between">
        <div style={{ whiteSpace: "pre-wrap" }}>
          <p className="max-w-3xl">{props.content}</p>
          {/* <div
            className="content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(marked.parse(props.content)),
            }}
          ></div> */}
        </div>
        <div className="mt-4 flex flex-row justify-start gap-x-2 text-slate-500 lg:mt-0">
          <button
            className="hover:text-blue-600"
            type="button"
            onClick={copyToClipboard}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z"></path>
              <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
