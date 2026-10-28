import React from "react";
import { S1 } from "./S1";
import { S2 } from "./S2";
import { S3 } from "./S3";
import { S4 } from "./S4";
import { S5 } from "./S5";
import { S6 } from "./S6";
import { S7 } from "./S7";
import { S8 } from "./S8";
import { S9 } from "./S9";
import { Credits, Post } from "./Post";

export const SCENES: Record<string, React.FC> = { s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6, s7: S7, s8: S8, s9: S9, post: Post, credits: Credits };
