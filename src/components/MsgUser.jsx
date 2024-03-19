export default function MsgUser(props) {
  return (
    <div className="flex flex-row px-4 py-8 sm:px-6">
      <img
        className="mr-2 flex h-8 w-8 rounded-full sm:mr-4"
        src="https://dummyimage.com/256x256/363536/ffffff&text=U"
      />
      <div className="flex max-w-3xl items-center">
        {props.content}
        {/* <p>{props.content}</p> */}
      </div>
    </div>
  );
}
