import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";

import "./index.css";
import App from "./Pages/App.jsx";
import Home from "./Pages/Home.jsx";
import ActressPage from "./Pages/actress.jsx";
import NetworkPage from "./Pages/network.jsx";
import WatchPage from "./Pages/watch.jsx";
import Login from "./Pages/loginpage.jsx";
import ProtectedRoute from "./component/protectrout/protectrout.jsx";
import SearchPage from "./Pages/search.jsx";
import Upload from "./Pages/upload.jsx";
import ChannelPage from "./Pages/channel.jsx";
import SeriesPage from "./Pages/series.jsx";
import AmericanPage from "./Pages/american.jsx";
import ChinaPage from "./Pages/china.jsx";
import JavPage from "./Pages/jav.jsx";
import EditPage from "./Pages/edit.jsx";
import MenuPage from "./Pages/menu.jsx";

const router = createHashRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "american",
        element: <AmericanPage />,
      },
      {
        path: "china",
        element: <ChinaPage />,
      },
      {
        path: "jav",
        element: <JavPage />,
      },
      
      {
        path: "watch/:id",
        element: <WatchPage />,
      },
      {
        path: "network/:name",
        element: <NetworkPage />,
      },
      {
        path: "channel/:name",
        element: <ChannelPage />,
      },
      {
        path: "series/:name",
        element: <SeriesPage />,
      },
      {
        path: "actress/:name",
        element: <ActressPage />,
      },
      {
        path: "search/:keyword",
        element: <SearchPage />,
      },
      {
        path: "upload",
        element: <Upload />,
      },
      {
        path: "edit",
        element: <EditPage/>
      },
      {
        path: "menu",
        element: <MenuPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
