import { Routes, Route } from 'react-router-dom';
import JoinPage from './pages/JoinPage';
import PlayerView from './pages/PlayerView';
import HostView from './pages/HostView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinPage />} />
      <Route path="/play" element={<PlayerView />} />
      <Route path="/host" element={<HostView />} />
    </Routes>
  );
}
