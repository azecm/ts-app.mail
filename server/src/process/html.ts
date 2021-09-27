import {
  Document,
  DocumentFragment,
  Element,
  CommentNode,
  Node,
  ParentNode,
  parse,
  parseFragment,
  serialize,
  TreeAdapter,
} from "parse5";
import { textOnly } from "../utils";

export const AttrHtml = "html";
export const AttrClass = "class";
export const AttrId = "id";
const nodeNameFragment = "#document-fragment";
const nodeNameDocument = "#document";

export const TagA = "a";
export const TagImg = "img";

const treeAdapter = require("parse5/lib/tree-adapters/default.js") as TreeAdapter;

const commonHtml = require("parse5/lib/common/html.js") as {
  DOCUMENT_MODE: {
    NO_QUIRKS: "no-quirks";
    QUIRKS: "quirks";
    LIMITED_QUIRKS: "limited-quirks";
  };
  NAMESPACES: {
    HTML: "http://www.w3.org/1999/xhtml";
    MATHML: "http://www.w3.org/1998/Math/MathML";
    SVG: "http://www.w3.org/2000/svg";
    XLINK: "http://www.w3.org/1999/xlink";
    XML: "http://www.w3.org/XML/1998/namespace";
    XMLNS: "http://www.w3.org/2000/xmlns/";
  };
};

type ElementBase = Pick<Element, "childNodes">;

// ==============

function selectCommentFn(node: ElementBase, nodes: CommentNode[]) {
  for (const n of node.childNodes) {
    if (!treeAdapter.isElementNode(n)) {
      if (treeAdapter.isCommentNode(n)) {
        nodes.push(n as CommentNode);
      }
      continue;
    }
    selectCommentFn(n as Element, nodes);
  }
}

function selectByFn(node: ElementBase, nodes: Element[], fn: (b: Element) => boolean, flagFirst = false) {
  if (flagFirst && nodes.length) return;
  for (const n of node.childNodes) {
    if (!treeAdapter.isElementNode(n)) continue;
    if (fn(n as Element)) {
      nodes.push(n as Element);
    }
    selectByFn(n as Element, nodes, fn, flagFirst);
  }
}

export function selectComments(node: ElementBase) {
  const nodes = [] as CommentNode[];
  selectCommentFn(node, nodes);
  return nodes;
}

export function selectFirstByClass(node: ElementBase, className: string) {
  const nodes = [] as Element[];
  selectByFn(node, nodes, (n) => hasClass(n, className), true);
  return nodes.length ? nodes[0] : null;
}

export function selectAllByClass(node: ElementBase, className: string) {
  const nodes = [] as Element[];
  selectByFn(node, nodes, (n) => hasClass(n, className));
  return nodes;
}

export function selectFirstByTagName(node: ElementBase, tagName: string) {
  const nodes = [] as Element[];
  selectByFn(node, nodes, (n) => n.nodeName == tagName, true);
  return nodes.length ? nodes[0] : null;
}

export function selectAllByTagName(node: ElementBase, tagName: string) {
  const nodes = [] as Element[];
  selectByFn(node, nodes, (n) => n.nodeName == tagName);
  return nodes;
}

export function selectFirstById(node: ElementBase, nodeId: string) {
  const nodes = [] as Element[];
  selectByFn(node, nodes, (n) => getAttributeValue(n, AttrId) === nodeId, true);
  return nodes.length ? nodes[0] : null;
}

export function selectAllByAttrName(node: ElementBase, attrName: string) {
  const nodes = [] as Element[];
  selectByFn(node, nodes, (n) => hasAttribute(n, attrName));
  return nodes;
}

export function selectFirst(node: ElementBase, selector: string) {
  const [nodeName, className] = selector.split(".");
  const nodes = [] as Element[];
  selectByFn(
    node,
    nodes,
    (n) => (nodeName ? n.nodeName == nodeName : true) && (className ? hasClass(n, className) : true),
    true,
  );
  return nodes.length ? nodes[0] : null;
}

// =============

export type TChildren = (Node | string | null)[];
type TAttr = { [s: string]: string | number | boolean | null | undefined } | null;

export function elementToParent(nodeName: string, attrs: TAttr, parent: ParentNode, children?: TChildren) {
  const elem = element(nodeName, attrs, children);
  if (parent) {
    appendChild(parent, elem as Node);
  }
  return elem;
}

export function insertTextBefore(target: Element, text: string) {
  const parent = target.parentNode;
  if (parent) {
    treeAdapter.insertTextBefore(parent, text, target);
  }
}

export function element(nodeName: string | Element, attrs?: TAttr, children?: TChildren): Element {
  const elem =
    typeof nodeName === "string"
      ? (treeAdapter.createElement(nodeName, commonHtml.NAMESPACES.HTML, []) as Element)
      : nodeName;

  if (attrs) {
    for (const k in attrs) {
      const val = attrs[k];
      if (val === null || val === undefined) continue;

      switch (k) {
        case AttrHtml:
          appendHtml(elem, val + "");
          break;
        default:
          elem.attrs.push({ name: k, value: val + "" });
          break;
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (child === null || child === undefined) continue;
      if (typeof child == "string") {
        for (const sub of getDocFragment(child).childNodes) {
          treeAdapter.appendChild(elem, sub);
        }
      } else {
        appendChild(elem as ParentNode, child);
      }
    }
  }
  return elem;
}

export function appendChild(parent: ParentNode, newNode: Node | null) {
  if (newNode === null) return;
  switch (newNode.nodeName) {
    case nodeNameDocument: {
      for (const n of getDocumentBody(newNode as Document).childNodes) {
        treeAdapter.appendChild(parent, n);
      }
      break;
    }
    case nodeNameFragment: {
      for (const n of (newNode as ParentNode).childNodes) {
        treeAdapter.appendChild(parent, n);
      }
      break;
    }
    default: {
      treeAdapter.appendChild(parent, newNode);
      break;
    }
  }
}

function appendHtml(elem: Element, html: string) {
  for (const sub of getDocFragment(html).childNodes) {
    treeAdapter.appendChild(elem, sub);
  }
}

export function documentToString(doc: Document | ParentNode) {
  return serialize(doc);
}

//
export function elementToString(node: ParentNode) {
  // фактически это innerHTML
  return serialize(node);
}

export function docBodyToString(doc: Document) {
  return serialize(getDocumentBody(doc));
}

export function getDocument(html: string) {
  return parse(html) as Document;
}

export function getDocumentElement(doc: Document) {
  return doc.childNodes[0] as Element;
}

export function getDocumentHead(doc: Document) {
  return getDocumentElement(doc).childNodes[0] as Element;
}

export function getDocumentBody(doc: Document) {
  return getDocumentElement(doc).childNodes[1] as Element;
}

export function getDocFragment(html: string) {
  return parseFragment(html) as DocumentFragment;
}

export function removeNode(target: Element | CommentNode | null) {
  if (target) {
    treeAdapter.detachNode(target);
  }
}

// ===========

export function getText(elem: Element) {
  return textOnly(serialize(elem));
}

export function setAttribute(elem: Element, attrName: string, attrValue: string) {
  const r = elem.attrs.filter((row) => row.name === attrName);
  if (r.length) r[0].value = attrValue;
  else elem.attrs.push({ name: attrName, value: attrValue });
}

export function getAttribute(elem: Element, attrName: string) {
  const r = elem.attrs.filter((row) => row.name === attrName);
  return r.length ? r[0] : null;
}

export function getAttributeValue(elem: Element, attrName: string) {
  return getAttribute(elem, attrName)?.value ?? "";
}

export function hasAttribute(elem: Element, attrName: string) {
  return getAttribute(elem, attrName) !== null;
}

export function removeAttribute(elem: Element, attrName: string) {
  const pos = elem.attrs.findIndex((row) => row.name === attrName);
  if (pos > -1) {
    elem.attrs.splice(pos, 1);
  }
}

export function hasClass(elem: Element, className: string) {
  return getAttributeValue(elem, AttrClass).split(" ").includes(className);
}

export function getClassList(elem: Element) {
  return getAttributeValue(elem, AttrClass).split(" ");
}

export function removeClass(elem: Element, className?: string) {
  if (className) {
    const set = new Set<string>(
      getAttributeValue(elem, AttrClass)
        .split(" ")
        .filter((v) => !!v),
    );
    if (!set.size) return;
    for (const val of className.split(" ")) {
      if (val) {
        set.delete(val);
      }
    }
    const list = [...set.values()];
    if (list.length) {
      setAttribute(elem, AttrClass, list.join(" "));
    } else {
      removeAttribute(elem, AttrClass);
    }
  }
}

export function addClass(elem: Element, className?: string) {
  if (className) {
    const set = new Set<string>(
      getAttributeValue(elem, AttrClass)
        .split(" ")
        .filter((v) => !!v),
    );
    if (className.includes(" ")) {
      for (const val of className.split(" ")) {
        if (val) {
          set.add(val);
        }
      }
    } else {
      set.add(className);
    }

    setAttribute(elem, AttrClass, [...set.values()].join(" "));
  }
  return elem;
}

// ===========
