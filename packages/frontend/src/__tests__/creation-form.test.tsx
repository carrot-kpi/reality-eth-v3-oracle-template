import { createRoot } from "react-dom/client";
import { Component as CreationForm } from "../creation-form";

describe("creation form", () => {
    it("renders without crashing", () => {
        const div = createRoot(document.createElement("div"));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        div.render(<CreationForm t={() => {}} onDone={() => {}} />);
        div.unmount();
    });
});
