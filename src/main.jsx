import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";

import "./index.css";
import ProtectedRoute from "./component/protectrout/protectrout.jsx";

// Eager-load anything needed immediately (e.g. layout, login)
import App from "./Pages/App.jsx";
import Login from "./Pages/loginpage.jsx";

// Lazy-load the rest
const Home = lazy(() => import("./Pages/Home.jsx"));
const ActressPage = lazy(() => import("./Pages/actress.jsx"));
const NetworkPage = lazy(() => import("./Pages/network.jsx"));
const WatchPage = lazy(() => import("./Pages/watch.jsx"));
const SearchPage = lazy(() => import("./Pages/search.jsx"));
const Upload = lazy(() => import("./Pages/upload.jsx"));
const ChannelPage = lazy(() => import("./Pages/channel.jsx"));
const SeriesPage = lazy(() => import("./Pages/series.jsx"));
const AmericanPage = lazy(() => import("./Pages/american.jsx"));
const ChinaPage = lazy(() => import("./Pages/china.jsx"));
const JavPage = lazy(() => import("./Pages/jav.jsx"));
const EditPage = lazy(() => import("./Pages/edit.jsx"));
const MenuPage = lazy(() => import("./Pages/menu.jsx"));

const withSuspense = (el) => (
  <Suspense fallback={<div>Loading...</div>}>{el}</Suspense>
);

const router = createHashRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: "american", element: withSuspense(<AmericanPage />) },
      { path: "china", element: withSuspense(<ChinaPage />) },
      { path: "jav", element: withSuspense(<JavPage />) },
      { path: "watch/:id", element: withSuspense(<WatchPage />) },
      { path: "network/:name", element: withSuspense(<NetworkPage />) },
      { path: "channel/:name", element: withSuspense(<ChannelPage />) },
      { path: "series/:name", element: withSuspense(<SeriesPage />) },
      { path: "actress/:name", element: withSuspense(<ActressPage />) },
      { path: "search/:keyword", element: withSuspense(<SearchPage />) },
      { path: "upload", element: withSuspense(<Upload />) },
      { path: "edit", element: withSuspense(<EditPage />) },
      { path: "menu", element: withSuspense(<MenuPage />) },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
