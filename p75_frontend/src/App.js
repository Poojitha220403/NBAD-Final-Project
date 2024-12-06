import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Summary from './components/Summary';
import Reports from './components/Reports';
import Admin from './components/Admin';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import useToken from './components/useToken';
import PageNotFound from './components/PageNotFound';
import setupAxiosInterceptors from './axiosInterceptor';
import Welcome from './components/Welcome';
import './App.css';

function App() {
  const { token, removeToken, setToken } = useToken();

  const logout = () => {
    removeToken();
    window.location.href = '/';
  };

  setupAxiosInterceptors(logout);

  return (
    <BrowserRouter>
      <div className="App">
        {token && <Navbar token={removeToken} />}
        <Switch>
          <Route path="/login">
            {!token ? <Login setToken={setToken} /> : <Redirect to="/dashboard" />}
          </Route>
          <PrivateRoute path="/dashboard" component={Dashboard} />
          <PrivateRoute path="/summary" component={Summary} />
          <PrivateRoute path="/reports" component={Reports} />
          <PrivateRoute path="/admin" component={Admin} />
          <Route exact path="/">
            {token ? <Redirect to="/dashboard" /> : <Welcome />}
          </Route>
          <Route path="*">
            <PageNotFound />
          </Route>
        </Switch>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;