const CIRCLE_COUNT = 10;
const CIRCLE_RADIUS = 50;
let circleMoved = new CustomEvent('circleMoved', { bubbles: true , detail : { x: 0, y: 0 }  });

class Circle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.node = document.createElement('div');
    this.color = this.generateColor();
    this.setStyle();
    document.body.appendChild(this.node);
    this.makeMovable(this.node);
  }
  set color(colorValue) {
    this._color = colorValue;
    this.node.style.backgroundColor = colorValue;
  }
  get color(){
    return this._color;
  }
  generateColor() {
    let rgb = '#';
    let i = 0;
    while (i < 3) {
      let colorCode = Math.floor(Math.random() * 256).toString(16);
      rgb += colorCode.length > 1 ? colorCode : `0${colorCode}`
      i += 1;
    }
    return rgb;
  }
  setStyle() {
    this.node.classList.add('circle');
    this.node.style.left = `${this.x - CIRCLE_RADIUS}px`;
    this.node.style.top = `${this.y - CIRCLE_RADIUS}px`;
  }
  makeMovable(element) {
    let movingElement;
    const workingElement = element;
    element.addEventListener('mousedown', (event) => {
      if (event.target === workingElement) {
        movingElement = workingElement;
        workingElement.dataset.x = event.x;
        workingElement.dataset.y = event.y;
      }
    });
    document.addEventListener('mousemove', (event) => {  // FIXME: Ошибочные координаты x, y (Учитывать радиус)
      let x;
      let y;
      let deltaX;
      let deltaY;
      const elementMeasurement = workingElement.getBoundingClientRect();
      const parentMeasurement = workingElement.parentElement;
      const elementComputedStyle = getComputedStyle(element);

      if (movingElement) {
        deltaX = event.x - workingElement.dataset.x;
        deltaY = event.y - workingElement.dataset.y;
        x = parseInt(elementComputedStyle.left || 0, 10) + deltaX;
        y = parseInt(elementComputedStyle.top || 0, 10) + deltaY;
        movingElement.style.zIndex = 10000;
        if ((x > 0) && (x < parentMeasurement.offsetWidth - elementMeasurement.width)) {
          workingElement.style.left = `${x}px`;
          workingElement.dataset.x = event.x;
        }
        if ((y > 0) && (y < parentMeasurement.offsetHeight - elementMeasurement.height)) {
          workingElement.style.top = `${y}px`;
          workingElement.dataset.y = event.y;
        }
      }
    });
    element.addEventListener('mouseup', () => {
      if (movingElement) {
        movingElement.style.zIndex = 0;
        delete movingElement.dataset.x;
        delete movingElement.dataset.y;
        movingElement = null;
      }
      element.dispatchEvent(circleMoved);
    });
  }
}

class Field {
  constructor() {
    this.node = document.querySelector('body');
    this.circlesList = [];
    this.generateStartCircles(10);
    document.body.addEventListener('circleMoved', (e) => {
      let coords = { x: e.target.offsetLeft + CIRCLE_RADIUS, y:e.target.offsetTop + CIRCLE_RADIUS}
      this.circlesList.forEach((item) => {
        if (item.node === e.target) {
          item.x = coords.x;
          item.y = coords.y;
        }
      });
      let isIntersect = checkIntersection(coords, this.circlesList, CIRCLE_RADIUS / 2 );
      if (isIntersect.intersect) {
        let newX = (coords.x + isIntersect.x) / 2;
        let newY = (coords.y + isIntersect.y) / 2;
        let color1 = this.hexToRGB(this.getObjectByNode(e.target).color);
        let color2 = this.hexToRGB(isIntersect.whoIntersect.color);
        this.node.removeChild(e.target);
        this.node.removeChild(isIntersect.whoIntersect.node);
        this.removeFromList(e.target);
        this.removeFromList(isIntersect.whoIntersect.node);
        let tmp = new Circle(newX, newY);
        tmp.color = this.mixColors(color1, color2);
        this.circlesList.push(tmp);
      }
    });
    document.body.addEventListener('dblclick', (e) => {
      if (e.target.className !== 'circle') {
        let coords = {x: e.x, y: e.y};
        if (!checkIntersection(coords, this.circlesList, CIRCLE_RADIUS * 2).intersect) {
          let tmp = new Circle(coords.x, coords.y);
          this.circlesList.push(tmp);
        }
      } else {
        this.node.removeChild(e.target);
        this.removeFromList(e.target);
      }
    });
  }
  mixColors(color1, color2) {
    let newColor = [];
    let i = 0;
    while (i < 3) {
      newColor.push(Math.floor((color1[i] + color2[i]) / 2).toString(16));
      i += 1;
    }
    return `#${newColor.join('')}`;
  }
  getObjectByNode(node) {
    let obj = {};
    this.circlesList.forEach((item) => {
      if (item.node === node) {
        obj = item;
      }
    });
    return obj;
  }
  hexToRGB(code) {
    const hex = code.split('').splice(1).join('');
    const r = parseInt(hex,16) >> 16;
    const g = parseInt(hex,16) >> 8 & 0xFF;
    const b = parseInt(hex,16) & 0xFF;
    return [r, g, b];
  }
  removeFromList(element) {
    this.circlesList.forEach((item, index) => {
      if (item.node === element) {
        this.circlesList.splice(index, 1);
      }
    });
  }
  generateStartCircles(count) {
    let coords = {};
    let generatedCoords = [];

    while (generatedCoords.length < count) {
      coords = this.generateRandomCoords();
      if (generatedCoords.length === 0) {
        generatedCoords.push(coords);
      } else {
        if (!checkIntersection(coords, generatedCoords, CIRCLE_RADIUS * 2).intersect) {
          generatedCoords.push(coords);
        }
      }
    }
    generatedCoords.forEach((item) => {
      this.circlesList.push(new Circle(item.x, item.y));
    });
  }

  generateRandomCoords() {
    const coords = {};
    const maxW = this.node.offsetWidth - CIRCLE_RADIUS * 2;
    const maxH = this.node.offsetHeight - CIRCLE_RADIUS * 2;

    coords.x = Math.floor(Math.random() * (maxW - CIRCLE_RADIUS) + CIRCLE_RADIUS);
    coords.y = Math.floor(Math.random() * (maxH - CIRCLE_RADIUS) + CIRCLE_RADIUS);

    return coords;
  }
}

function checkIntersection(newCoords, allowCoords, radius) { // newCoords - Object (x, y), allowCoords - Arr of Object (x, y)
  for (let i = 0; i < allowCoords.length; i++) {
    if (newCoords.x === allowCoords[i].x) {
      continue;
    }
    if (Math.sqrt(Math.pow(newCoords.x - allowCoords[i].x, 2) + Math.pow(newCoords.y - allowCoords[i].y, 2)) <= radius) {
      return { intersect: true, whoIntersect: allowCoords[i] , x: newCoords.x, y : newCoords.y}; // Пересечение
    }
  }
  return { intersect: false, whoIntersect: null };
}

let f = new Field();
