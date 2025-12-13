import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (children) return children;
  return <Outlet />;
}

GuestRoute.propTypes = {
  children: PropTypes.node,
};

GuestRoute.defaultProps = {
  children: null,
};

export default GuestRoute;
