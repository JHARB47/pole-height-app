import React from "react";
import { Link, useInRouterContext } from "react-router-dom";

/**
 * SafeLink renders react-router Link when inside a Router context,
 * otherwise falls back to a standard anchor tag to avoid context errors.
 */
export default function SafeLink({ to, children, ...rest }) {
  const inRouter = useInRouterContext();
  if (!inRouter) {
    // Preserve accessibility and styling when falling back
    return (
      <a href={typeof to === "string" ? to : "#"} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
}
