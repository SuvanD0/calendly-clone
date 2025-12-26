import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import './index.css';

render(() => (
  <Router>
    <Route path="/" component={Home} />
    <Route path="/booking" component={Booking} />
    <Route path="/login" component={Login} />
    <Route path="/dashboard" component={Dashboard} />
  </Router>
), document.getElementById('root')!);

