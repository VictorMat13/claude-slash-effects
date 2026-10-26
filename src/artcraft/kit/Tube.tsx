import React from "react";
import { CRT as FishCRT, type CrtProps } from "../../fish8/crt";

// The ArtCraft series' CRT pass: the approved CRT Scope tube with the
// "readable" grade (Victor, Oct 13: "some of the stuff is kind of hard to
// read"). Ground still crushes to black; mid-grey UI text and labels survive.
export const CRT: React.FC<CrtProps> = ({ grade = "readable", ...rest }) => <FishCRT grade={grade} {...rest} />;
