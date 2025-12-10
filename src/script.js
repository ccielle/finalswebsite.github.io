function isObject(variable) {
  return typeof variable === 'object' && variable !== null && !Array.isArray(variable);
}

function isPromise(variable) {
  return variable instanceof Promise;
}

function isElement(variable) {
  return variable instanceof Element;
}

function checkIfElementIsTag(element, tagName) {
  if (!isElement(element)) return false;
  if (element && element.tagName) {
    return element.tagName.toLowerCase() === tagName.toLowerCase();
  }
  return false;
}

function createElementFromHTML(html) {
  const element = document.createElement('div');
  element.innerHTML = html;
  return element.removeChild(element.firstElementChild);
}

function findSiblingByQuerySelector(element, selector) {
  let nextSibling = element.nextElementSibling;
  while (nextSibling) {
    if (nextSibling.matches(selector)) {
      return nextSibling;
    }
    nextSibling = nextSibling.nextElementSibling;
  }
  nextSibling = element.previousElementSibling;
  while (nextSibling) {
    if (nextSibling.matches(selector)) {
      return nextSibling;
    }
    nextSibling = nextSibling.previousElementSibling;
  }
  return null
}

function setClassActiveIfTarget(event, element, boolean) {
  if (event.target == element) {
    setClassActive(element, boolean);
  }
  return element;
}

function setClassActive(element, boolean) {
  if(boolean) {
    if (!('active' in element.dataset)) {
      element.dataset.active = true;
    }
  } else {
    if ('active' in element.dataset) {
      delete element.dataset.active;
    }
  }
  return element;
}

function toggleClassActive(element) {
  if ('active' in element.dataset) {
      delete element.dataset.active;
  } else {
      element.dataset.active = true;
  }
  return element;
}

async function getFileJsonObject(path) {
  const fetched = await fetch(path);
  const obj = await fetched.json();
  return obj;
}

async function getFileText(path) {
  const fetched = await fetch(path);
  const html = await fetched.text();
  return html;
}

async function createComponentByName(componentName) {
  const element = document.createElement('div');
  element.innerHTML = await getFileText(`/src/components/${componentName}.html`);
  return element.firstChild;
}

async function createComponents() {
  const elements = document.querySelectorAll('template.component');
  for (const element of elements) {
    element.classList.remove('component');
    const className = element.classList[0].toString();
    element.outerHTML = await getFileText(`components/${className}.html`);
  }
}

createComponents();



class ElementObj {
    element = document.createElement('template');
    #promise;
    listeners = [];
    #loaded = false;

    constructor(element) {
      if (typeof element === "string") {
        this.replaceWith(createElementFromHTML(element));
      } else if (isElement(element)) {
        this.replaceWith(element);
        this.#loaded = true;
      } else if (isPromise(element)) {
        this.#promise = element;
        this.#promise.then((result) => {
            this.replaceWith(result);
            this.#loaded = true;
        });
      }
    }

    setInnerHTML(text) {
      this.element.innerHTML = text;
    }

    #identifyHTML(object) {
      if (object instanceof ElementObj) {
        return object.element;
      } else if(typeof element === "string") {
        return createElementFromHTML(element);
      } else if(isElement(object)) {
        return object;
      }
      return object;
    }

    querySelector(selector) {
      return this.element.querySelector(selector);
    }

    querySelectorAll(selector) {
      return this.element.querySelectorAll(selector);
    }

    replaceWith(element) {
      this.element.replaceWith(this.#identifyHTML(element));
      this.element = element;
    }

    appendChild(element) {
      this.element.appendChild(this.#identifyHTML(element));
    }

    removeChild(element) {
      this.element.removeChild(this.#identifyHTML(element));
    }

    addEventListener(event, func) {
      if (this.#loaded) {
        this.element.addEventListener(event, func);
      } else {
        this.#promise.then((result) => {
          result.addEventListener(event, func);
        });
      }
    }

    then(func) {
      if (this.#loaded) {
        func(this.element);
      } else {
        this.#promise.then(func);
      }
      return this;
    }

    destroy() {
      this.element.remove();
    }
}

class Carousel extends ElementObj {
    imgContainer;
    dotsContainer;
    currentIndex = -1;
    looping = true;
    isOneImg = false;

    constructor(images) {
      super(
        createComponentByName('img_carousel').then((result) => {
          this.imgContainer = result.querySelector('.carouselImg');
          this.dotsContainer = result.querySelector('.carouselDots');
          if (!images) return result;
          if (images.length < 1) return result;
          images.forEach(image => {
              this.pushImage(image);
          });
          if (this.imgContainer.children.length <= 1) {
            this.dotsContainer.remove();
            this.isOneImg = true;
          }
          this.#setActiveIndex(0);
          result.dataset.index = 0;
          return result;
        }));
    }

    reset() {
      try {
        this.#setActiveIndex(0);
      } catch (error) {
        
      }
    }

    pushImage(image) {
        if (checkIfElementIsTag(image, 'img')) {
            this.imgContainer.appendChild(image);
            this.dotsContainer.appendChild(document.createElement('span'));
            return image;
        } else {
            const imgElement = document.createElement('img');
            imgElement.src = image;
            imgElement.alt = "undefined";
            this.imgContainer.appendChild(imgElement);
            this.dotsContainer.appendChild(document.createElement('span'));
            return imgElement;
        }
    }

    popImage() {
        const lastChild = this.imgContainer.lastElementChild;
        if (lastChild) {
            this.imgContainer.removeChild(lastChild);
            this.dotsContainer.removeChild(this.dotsContainer.lastElementChild);
            return imgElement;
        }
    }

    #setActiveIndex(index) {
        let newIndex = index;
        const images = this.imgContainer.children;
        if (newIndex > (images.length - 1)) {
            newIndex = this.looping ? 0 : images.length - 1;
        } else if (newIndex < 0) {
            newIndex = this.looping ? images.length - 1 : 0;
        }
        if (newIndex == this.currentIndex) return;
        const dots = this.dotsContainer.children;
        if (this.currentIndex >= 0 && this.currentIndex < images.length) {
            delete images[this.currentIndex].dataset.active;
            delete dots[this.currentIndex].dataset.active;
        }
        this.element.dataset.index = newIndex;
        images[newIndex].dataset.active = true;
        dots[newIndex].dataset.active = true;
        this.currentIndex = newIndex;
    }

    next() {
        if (this.imgContainer.children.length <= 1) return;
        this.#setActiveIndex(this.currentIndex + 1);
    }

    previous() {
        if (this.imgContainer.children.length <= 1) return;
        this.#setActiveIndex(this.currentIndex - 1);
    }
}

const landingBtns = document.querySelectorAll('a[data-category]');
if (landingBtns) {
  landingBtns.forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      const searchParams = new URLSearchParams({
        category: element.dataset.category
      });
      const url = element.href + '?' + searchParams.toString();
      window.location.href = url;
    });
  });
}