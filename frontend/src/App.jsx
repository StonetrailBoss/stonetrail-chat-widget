import StonetrailChatWidget from "./StonetrailChatWidget.jsx";

import StaffInbox from "./StaffInbox.jsx";

function App() {
  if (window.location.pathname.startsWith("/staff")) return <StaffInbox />;
  return <StonetrailChatWidget />;
}

export default App;
