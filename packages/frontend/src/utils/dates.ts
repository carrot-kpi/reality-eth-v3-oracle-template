export const isInThePast = (date: Date) => {
    return date.getTime() < Date.now();
};
