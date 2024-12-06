import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';

const setupAxiosInterceptors = (logout) => {
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.data && error.response.data.msg === 'Token has expired') {
        toast.error('Session expired. Please log in again.');
        logout();
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;