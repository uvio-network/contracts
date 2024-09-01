import moment from "moment";

export const Expiry = (num: number, str?: moment.unitOfTime.DurationConstructor): string => {
  if (num === 0) return "0";
  return BigInt(moment().add(num, str).unix()).toString();
};
