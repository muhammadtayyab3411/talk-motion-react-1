import React from "react";
import { Result, Button } from "antd";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="mh-100vh flex flex-center-center">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Link to={"/"}>
            <Button type="primary">Back Home</Button>
          </Link>
        }
      />
    </div>
  );
}

export default NotFound;
