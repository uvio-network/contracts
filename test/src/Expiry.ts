import moment from "moment";

export const Expiry = (num: number, str: moment.unitOfTime.DurationConstructor): bigint => {
  return BigInt(moment().add(num, str).unix());
};
