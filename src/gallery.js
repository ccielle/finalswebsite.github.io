class GalleryItem extends Carousel {
    static idGlobal = 1;
    id = this.idGlobal++;
    name;
    description;

    constructor(name, description, images) {
        super(images).then((result) => {
            if (!this.isOneImg) this.#modifyElement(result);
            for (const element of this.imgContainer.children) element.alt = name;
            this.description = description;
            return result;
        });
    }

    setElement(object) {
        if (!(object instanceof GalleryItem)) return;
        let element = object.element.cloneNode(true);
        this.replaceWith(element);
        this.imgContainer = element.querySelector('.carouselImg');
        this.dotsContainer = element.querySelector('.carouselDots');
        const index = Number(element.dataset.index);
        this.currentIndex = index;
        if (this.imgContainer.children.length > 1) {
            this.#modifyElement(element);
        }
    }

    #modifyElement(element) {
        let prevBtn = element.querySelector('.carouselPrevBtn');
        if (!prevBtn) {
            prevBtn = createElementFromHTML(
                `<button class="carouselPrevBtn">
                    <img src="/assets/icons/caret-right-bold.svg" alt="">
                </button>`
            );
            element.appendChild(prevBtn);
        }
        prevBtn.addEventListener('click', () => {
            this.previous();
        });

        let nextBtn = element.querySelector('.carouselNextBtn');
        if (!nextBtn) {
            nextBtn = createElementFromHTML(
                `<button class="carouselNextBtn">
                    <img src="/assets/icons/caret-right-bold.svg" alt="">
                </button>`
            );
            element.appendChild(nextBtn);
        }
        nextBtn.addEventListener('click', () => {
            this.next();
        });
    }
}

class GalleryHandler {
    activeItems = [];
    items = new Map();
    activeCategory = 'All';
    activeTags = 'All';
    allIDs = [];
    categories = new Map();
    tags = new Map();

    #itemPopUp = new ItemPopup();

    #timeoutIDs = [];

    constructor(items) {
        document.querySelector('body').appendChild(this.#itemPopUp.element);
        for (const item of items) {
            this.#parseItem(item);
        }
    }

    #parseItem(object) {
        let {id, name, category, section, item_description, material_list, stone_list, image_list} = object;
        if (this.items.get(id)) {
            return;
        }
        const item = new GalleryItem(name, item_description, image_list);
        item.then(itemElement => {
            item.imgContainer.addEventListener('click', (event) => {
                this.#itemPopUp.setDisplay(item);
                this.#itemPopUp.enable();
            });
        });
        
        item.id = id;
        this.items.set(id, item);
        this.allIDs.push(id);

        let categoryList = this.categories.get(category);
        if (!categoryList) {
            categoryList = [];
            this.categories.set(category, categoryList);
        }
        if (section != null) {
            let found = false;
            for (const cat of categoryList) {
                if (isObject(cat)) {
                    if (cat.section == section) {
                        cat.items.push(id);
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                const newSection = {
                    section: section,
                    items: []
                };
                newSection.items.push(id);
                categoryList.push(newSection);
            }
        } else {
            categoryList.push(id);
        }

        for (const material of material_list) {
            let materialList = this.tags.get(material);
            if (!materialList) {
                materialList = [];
                this.tags.set(material, materialList);
            }
            materialList.push(id);
        }

        for (const stone of stone_list) {
            let stoneList = this.tags.get(stone);
            if (!stoneList) {
                stoneList = [];
                this.tags.set(stone, stoneList);
            }
            stoneList.push(id);
        }
    }

    #renderItems() {
        for (const timeoutID of this.#timeoutIDs) {
            clearTimeout(timeoutID);
        }
        this.#timeoutIDs = [];
        const catalogue = document.querySelector('.catalogue');
        if (!catalogue) return;
        catalogue.replaceChildren();
        const container = createElementFromHTML('<div class="itemContainer"></div>');
        catalogue.appendChild(container);
        
        for (let index = 0; index < this.activeItems.length; index++) {
            let currItem = this.activeItems[index];
            if (isObject(currItem)) {
                this.#renderSection(currItem, catalogue, container);
            } else {
                this.#renderCarousel(currItem, container, index);
            }
        }

    }

    #renderSection(currItem, catalogue, container) {
        createComponentByName('gallery_section').then(result => {
            catalogue.appendChild(result);
            const subContainer = result.querySelector('.itemContainer');
            const title = result.querySelector('.sectionContainer-title p');
            title.innerHTML = currItem.section;
            for (let index = 0; index < currItem.items.length; index++) {
                this.#renderCarousel(currItem.items[index], container, index);
            }
        });
    }

    #renderCarousel(currItem, container, index) {
        this.#timeoutIDs.push(
            setTimeout(() => {
                const item = this.items.get(currItem);
                item.reset();
                container.appendChild(item.element);
            }, 50 * index)
        );
    }

    #filther(category, tags) {
        return this.#filtherTags(this.#filtherCategory(this.allIDs, category), tags);
    }

    #filtherCategory(ids, category) {
        if (category == 'All') {
            return ids;
        }
        const list = this.categories.get(category);
        if (!list) return ids;
        return list;
    }

    #filtherTags(ids, tags) {
        if (tags == 'All') return ids;
        for (const tag of tags) {
            if (tag == 'All') return ids;
        }

        const map = new Map();
        for (const id of ids) {
            const item = map.get(id);
            if (item) {
                continue;
            }

            for (const tag of tags) {
                const listTags = this.tags.get(tag);
                if (listTags) {
                    if (isObject(id)) {
                        for (const innerID of id.items) {
                            let isBreak = false;
                            for (const tagID of listTags) {
                                if (tagID == innerID) {
                                    map.set(id, id);
                                    isBreak = true;
                                    break;
                                }
                            }
                            if (isBreak) {
                                break;
                            }
                        }
                    } else {
                        for (const tagID of listTags) {
                            if (tagID == id) {
                                map.set(id, id);
                                break;
                            }
                        }
                    }
                    continue;
                }
            }
        }
        return [...map.values()];
    }

    setCategory(category) {
        this.activeCategory = category;
        this.activeItems = this.#filther(this.activeCategory, this.activeTags);
        this.#renderItems();
    }

    setTags(tags) {
        this.activeTags = tags;
        this.activeItems = this.#filther(this.activeCategory, this.activeTags);
        this.#renderItems();
    }

}

class FilterPopup extends ElementObj{
    #state = false;

    constructor(tagObject) {
        const element = createComponentByName('galleryFilterPopUp').then(result => {
            for (const material of tagObject.materials) {
                const matBtn = createElementFromHTML(
                    `<label>
                        <input type="checkbox" name="${material}" value="${material}">
                        <span>${material}</span>
                    </label>`
                );
                matBtn.addEventListener('change', (event) => {
                    setTag(material, event);
                });
                result.querySelector('.buttonContainers.material').appendChild(matBtn);
            }
            for (const stone of tagObject.stones) {
                const stoneBtn = createElementFromHTML(
                    `<label>
                        <input type="checkbox" name="${stone}" value="${stone}">
                        <span>${stone}</span>
                    </label>`
                );
                stoneBtn.addEventListener('change', (event) => {
                    setTag(stone, event);
                });
                result.querySelector('.buttonContainers.stone').appendChild(stoneBtn);
            }
            result.addEventListener('click', (event) => {
                if (event.target.classList.contains("galleryPopup-Background")) {
                    this.disable();
                }
            });
            result.querySelector('.popUpHeader').addEventListener('click', (event) => {
                this.disable();
            });
            document.querySelector('body').appendChild(result);
            return result;
        });
        super(element);
    }
    setState(bool) {
        if (bool == this.#state) return;
        if (bool) {
            this.element.dataset.active = true;
        } else {
            delete this.element.dataset.active;
        }
        this.#state = bool;
    }
    enable() {
        this.setState(true);
    }
    disable() {
        this.setState(false);
    }
}

class ItemPopup extends ElementObj{
    #state = false;
    #itemDesc;
    #itemCarousel;
    #itemCarouselObj;

    constructor() {
        const element = createComponentByName('galleryItemPopUp').then(result => {
            this.#itemDesc = result.querySelector('.itemDescription');
            this.#itemCarousel = result.querySelector('.item');
            result.querySelector('button').addEventListener('click', (event) => {
                window.location.href = 'contactus.html';
            });
            result.querySelector('.popUp-close').addEventListener('click', (event) => {
                this.disable();
            });
            this.#itemCarouselObj = new GalleryItem(null, null, null);
            this.#itemCarousel.replaceWith(this.#itemCarouselObj.element);
            this.#itemCarousel = this.#itemCarouselObj.element;
            return result;
        });
        super(element);
    }
    setDisplay(item) {
        this.#itemCarouselObj.setElement(item);
        this.#itemDesc.innerText = item.description;
    }
    setState(bool) {
        if (bool == this.#state) return;
        if (bool) {
            this.element.dataset.active = true;
        } else {
            delete this.element.dataset.active;
            this.#itemDesc.innerHTML = '';
            this.#itemCarousel.innerHTML = '';
        }
        this.#state = bool;
    }
    enable() {
        this.setState(true);
    }
    disable() {
        this.setState(false);
    }
}

function getTags(items) {
    const materials = [];
    const stones = [];
    const all = [];
    for (const item of items) {
        let {material_list, stone_list} = item;
        for (const material of material_list) {
            if (!materials.includes(material)) {
                materials.push(material);
                all.push(material);
            }
        }
        for (const stone of stone_list) {
            if (!stones.includes(stone)) {
                stones.push(stone);
                all.push(stone);
            }
        }
    }
    return {
        materials: materials,
        stones: stones,
        all: all
    };
}

function setCat(params) {
    handler.setCategory(params);
}

function setTag(params, event) {
    const element = event.target;
    if (element.checked) {
        tags.push(params);
    } else {
        tags = tags.filter(item => item !== params);
    }
    if (tags.length === 0) {
        handler.setTags(allTags);
    } else {
        handler.setTags(tags);
    }
}

function setPageCatState(params) {
    document.querySelector(`#select${params}`).checked = true;
    setCat(params);
}


let handler;
let popUp;
let filterPopup;
let tags = [];
let allTags;

const items = getFileJsonObject(`/assets/data/jewelry.json`).then(result => {
    const tagsObj = getTags(result);
    allTags = tagsObj.all;
    handler = new GalleryHandler(result);
    popUp = new FilterPopup(tagsObj);

    const url = window.location.href;
    const obj = Object.fromEntries(new URL(url).searchParams);
    if (obj.category) {
        setPageCatState(obj.category);
    } else {
        setPageCatState('All');
    }

    document.querySelectorAll('.galleryRadio').forEach(element => {
        element.addEventListener('click', (event) => {
            setCat(event.target.dataset.category);
        });
    });

    document.querySelector('.infoSwitch').addEventListener('click', (event) => {
        popUp.enable();
    });

    return result;
});