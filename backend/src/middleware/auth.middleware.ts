// import { Request, Response, NextFunction } from "express";
// import { verifyAccessToken } from "../utils/jwt";
// import { ResponseUtil } from "../utils/response";

// export const authenticate = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return ResponseUtil.error(res, "No token provided", 401);
//     }

//     const token = authHeader.split(" ")[1];

//     try {
//       const decoded = verifyAccessToken(token);
//       req.user = decoded;
//       next();
//     } catch (error) {
//       return ResponseUtil.error(res, "Invalid or expired token", 401);
//     }
//   } catch (error) {
//     return ResponseUtil.error(res, "Authentication failed", 401);
//   }
// };

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ResponseUtil } from "../utils/response";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string;

    // DEBUG LOGS
    // console.log("--- Auth Debug ---");
    // console.log("Header Token exists:", !!authHeader);
    // console.log("Query Token exists:", !!queryToken);

    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      console.log("Rejecting: No token found");
      return ResponseUtil.error(res, "No token provided", 401);
    }

    try {
      const decoded = verifyAccessToken(token);
      (req as any).user = decoded;
      next();
    } catch (error) {
      return ResponseUtil.error(res, "Invalid or expired token", 401);
    }
  } catch (error) {
    return ResponseUtil.error(res, "Authentication failed", 401);
  }
};
