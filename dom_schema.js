"use strict";

const BODY_REPRESENTOR_COLOR = "black";
const HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.4)";
const CONTAINER_NAME = "schema-container";
const REPRESENTOR_CLASS_NAME = "element-representor";
const COLORS = [
  "#e81123",
  "#ec008c",
  "#00188f",
  "#00bcf2",
  "#00b294",
  "#009e49",
  "#ff8c00",
  "#fff100",
  "#68217a",
];
const DOM_SCHEMA_STYLE = `
.schema-container {
    display: flex;
    flex-direction: column;
    width: 25%;
  }

  .schema-container div {
    font-size: 1rem;
    font-family: Geneva, Verdana, sans-serif;
    padding: 0.3em;
    margin: 0.3em;
    color: white;
    flex: 1;
  } 
`;

/**
 * Responsible for picking the colors of the boxes
 * representing elements in the HTML page
 */
class ColorPicker {
  constructor() {
    this.colorQueue = [...COLORS];
    this.elementsColorMap = new Map();
  }

  getColor(htmlElemTagName, parentElemColor, preSiblingElemColor) {
    if (this.elementsColorMap.has(htmlElemTagName)) {
      return this.elementsColorMap.get(htmlElemTagName);
    }

    while (
      this.colorQueue[0] === parentElemColor ||
      this.colorQueue[0] === preSiblingElemColor
    ) {
      this.colorQueue.push(this.colorQueue.shift());
    }
    this.elementsColorMap.set(htmlElemTagName, this.colorQueue[0]);
    return this.colorQueue[0];
  }
}

/**
 * Represents an HTML element in the DOM representation
 */
class ElementRepresentor extends HTMLDivElement {
  constructor(color, index, pointedElement, text) {
    super();
    this.style.backgroundColor = color;
    this.id = `elem#${index}`;
    this.pointedElement = pointedElement;
    this.textContent = text;
    this.className = REPRESENTOR_CLASS_NAME;
    this.elementBgColor = pointedElement.style.backgroundColor;
  }
}

/**
 * Creates a nested boxes representation of the DOM tree. For example:
 * 
 *  ****************************
 *  * body                     *
 *  * **********************   *
 *  * * div                *   *  
 *  * * ****************** *   *
 *  * * * span           * *   *
 *  * * ****************** *   *
 *  * **********************   *
 *  ****************************
 */
class DomSchema extends HTMLElement {
  constructor() {
    super();
    this.elementsNumber = 0;
    const shadow = this.attachShadow({ mode: "open" });
    this.colorPicker = new ColorPicker();
    let style = document.createElement("style");
    style.textContent = DOM_SCHEMA_STYLE;
    shadow.appendChild(style);
    const schemaContainer = document.createElement("div");
    schemaContainer.className = CONTAINER_NAME;
    schemaContainer.appendChild(this.createSchema());
    shadow.appendChild(schemaContainer);
  }

  /**
   * Scrapes the page structure using BFS.
   */
  createSchema() {
    const schema = new ElementRepresentor(
      BODY_REPRESENTOR_COLOR,
      this.elementsNumber++,
      document.body,
      document.body.nodeName.toLocaleLowerCase()
    );

    let fringe = [schema];
    let preElemColor = BODY_REPRESENTOR_COLOR;

    while (fringe.length != 0) {
      let currentRepresentor = fringe.pop();
      let children = [...currentRepresentor.pointedElement.children];
      children.forEach((htmlElem) => {
        let color = this.colorPicker.getColor(
          htmlElem.nodeName,
          currentRepresentor.style.background,
          preElemColor
        );
        preElemColor = color;
        let newRepresentor = new ElementRepresentor(
          color,
          this.elementsNumber++,
          htmlElem,
          htmlElem.nodeName.toLocaleLowerCase()
        );
        currentRepresentor.appendChild(newRepresentor);
        fringe.push(newRepresentor);
      });
    }
    return schema;
  }

  /* Highlights the HTML element in the page when pointin on it representor. */
  highlight(representor) {
    representor.pointedElement.style.backgroundColor = HIGHLIGHT_COLOR;
  }

  unhighlight(representor) {
    if (representor.elementBgColor) {
      representor.pointedElement.style.backgroundColor =
        representor.elementBgColor;
    } else {
      representor.pointedElement.style.backgroundColor = "";
    }
  }

  connectedCallback() {
    for (let i = 0; i < this.elementsNumber; i++) {
      let representor = this.shadowRoot.getElementById(`elem#${i}`);
      representor.addEventListener("mouseover", (e) =>
        this.highlight(e.target)
      );
      representor.addEventListener("mouseout", (e) =>
        this.unhighlight(e.target)
      );
    }
  }

  disconnectedCallback() {
    if (!this.schema) return;
    for (let i = 0; i < this.elementsNumber; i++) {
      let representor = this.shadowRoot.getElementById(`elem#${i}`);
      representor.removeEventListener("mouseover", (e) =>
        this.highlight(e.target)
      );
      representor.removeEventListener("mouseout", (e) =>
        this.unhighlight(e.target)
      );
    }
  }
}

/** Add the web component to the HTML page */
customElements.define("element-representor", ElementRepresentor, {
  extends: "div",
});
customElements.define("dom-schema", DomSchema);
document.body.appendChild(new DomSchema());
