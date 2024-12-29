import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: IUser;
}

interface DecodedToken extends JwtPayload {
  _id: string;
}

export const verifyJWT = asyncHandler(
  async (req: CustomRequest, _: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }

      const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

      if (!accessTokenSecret) {
        throw new Error("ACCESS_TOKEN_SECRET is not defined");
      }

      const decodedToken = jwt.verify(token, accessTokenSecret) as DecodedToken;

      const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, error.message || "Invalid access token");
    }
  }
);
