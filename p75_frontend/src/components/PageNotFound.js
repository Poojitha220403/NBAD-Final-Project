import React from 'react';
import { Link } from 'react-router-dom';

function PageNotFound() {
  return (
    <div>
      <h2>Page Not Found</h2>
      <p>
        The page you are looking for does not exist. Go to the <Link to="/">home page</Link>.
      </p>
    </div>
  );
}

export default PageNotFound;