export const printInstructions = (writableStream, globals, extra) => {
    let printable =
        "Playground core frontend available at:\n\n  http://localhost:3000\n\n" +
        "Globals available:\n\n" +
        Object.entries(globals).reduce((accumulator, [key, value]) => {
            accumulator += `  ${key}: ${value}\n`;
            return accumulator;
        }, "");
    if (extra) printable += `\n ${extra}`;
    writableStream.write(printable);
};
