type Options = {
  params?: Record<string, string>;
  data?: unknown;
};

type PageProperties = {
  name: string;
  pathname: string;
  element: HTMLElement;
};

export default class Page {
  public name: string;
  public pathname: string;
  public element: HTMLElement;

  constructor(props: PageProperties) {
    this.name = props.name;
    this.pathname = props.pathname;
    this.element = props.element;
  }

  show() {
    this.element.classList.add("active");
  }

  hide() {
    this.element.classList.remove("active");
  }

  async beforeShow(_options?: Options): Promise<void> { }
  async afterShow(): Promise<void> { }
  async beforeHide(): Promise<void> { }
  async afterHide(): Promise<void> { }
}
