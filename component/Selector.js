class Selector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.mainColor = this.getAttribute('mainColor');
        this.placeholder = this.getAttribute('placeholder');
        this._style = this.getAttribute('style');
        this.autoSelectFirst = this.getAttribute('autoSelectFirst');
    }

    set list(value) {
        this._list = value;
        this.dispatchEvent(new CustomEvent('setList'));
    }

    get value() {
        const thisName = this.shadowRoot.querySelector("#selectName").textContent;
        const thisValue = this.shadowRoot.querySelector("#role").value;
        if (thisName === thisValue) {
            return thisValue;
        } else {
            return {name: thisName, value: thisValue};
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            #selectOptionList div:hover {
                background-color: #ccc;
            }
            
            .selectedOne {
                background-color: #ccc;
            }
            
            #selectOptionList::-webkit-scrollbar {
                width: 0.4rem;
            }

            #selectOptionList::-webkit-scrollbar-track {
                border-radius: 0.6rem;
                background: rgba(0, 0, 0, 0.06);
                -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.08);
            }

            #selectOptionList::-webkit-scrollbar-thumb {
                border-radius: 0.6rem;
                background: rgba(0, 0, 0, 0.12);
                -webkit-box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
            }
            
            .normal-body {
                border:1px solid ${this.mainColor};
                padding: 0.8rem 1rem;
            }
            
            .normal-list {
                border:1px solid ${this.mainColor};
                border-top: 0;
                padding: 0.2rem 0;
            }
        </style>
        <div id="selector" tabIndex="-1" class="normal-body"
             style="display: flex;justify-content: space-between;align-items: center;border-radius: 0.6rem;cursor: ${this.disabled ? "not-allowed" : "pointer"};background-color: ${this.disabled ? "light-dark(rgba(239, 239, 239, 0.3), rgba(59, 59, 59, 0.3));" : "transparent"};${this._style}">
            <div id="selectName" style="user-select: none;height:1.5rem;line-height:1.5rem;width: 100%;color: rgb(190,191,192);padding-right: 0.1rem;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">
                ${this.placeholder || ""}
            </div>
            <input style="display: none;line-height:1.5rem;" name="value" id="value">
            <img style="user-select: none;" id="selectorIcon" width="20" height="20" src="./component/media/Selector.svg"/>
        </div>
        <div id="selectOptionList" class="normal-list"
             style="z-index: 50;position:absolute;display: none;background-color: white;border-radius:0 0 0.6rem 0.6rem;max-height: 14rem;overflow-y: auto;">
        </div>
    `
    }

    connectedCallback() {
        this.render()

        const that = this;

        let inQueryList = false;
        let selectedOne

        const selector = this.shadowRoot.querySelector("#selector");
        const select = selector.querySelector("#selectName");
        const selectorIcon = this.shadowRoot.querySelector("#selectorIcon");
        const selectOptionList = this.shadowRoot.querySelector("#selectOptionList");

        this.dispatchEvent(new CustomEvent('changeCallBack', {
            composed: true
        }));

        this.dispatchEvent(new CustomEvent('queryMore', {
            composed: true
        }));

        this.addEventListener('setList', () => {
            setList();
        });

        const loading = document.createElement('span');
        loading.id = "loading";
        loading.style.textAlign = "center";
        loading.style.width = "100%";
        loading.style.display = "block";

        const img = document.createElement('img');
        img.id = "selectorIcon";
        img.width = 20;
        img.height = 20;
        img.src = "./component/media/Rolling.svg";
        loading.appendChild(img);

        const loadingText = document.createElement('span');
        loadingText.id = "loadingText";
        loading.appendChild(loadingText);

        function setList() {
            selector.style.cursor = "pointer";
            selector.style.backgroundColor = "transparent";
            selectOptionList.innerHTML = ""
            let isOldList = false;
            that._list.forEach(value => {
                const valueItem = document.createElement('div');
                valueItem.style.cursor = "pointer";
                valueItem.style.padding = "0.7rem 1rem";
                valueItem.style.overflow = "hidden";
                valueItem.style.textOverflow = "ellipsis";
                valueItem.style.whiteSpace = "nowrap";
                if (typeof value === "object") {
                    if (value.id) {
                        valueItem.id = value.id.toString();
                    } else {
                        valueItem.id = value.name.toString();
                    }
                    valueItem.innerText = value.name.toString();
                } else {
                    valueItem.id = value.toString();
                    valueItem.innerText = value.toString();
                }
                if (selectedOne) {
                    if (selectedOne.id && selectedOne.id === valueItem.id) {
                        isOldList = true;
                    } else if (!selectedOne.id && selectedOne.name === valueItem.innerText) {
                        isOldList = true;
                    }
                }
                valueItem.title = valueItem.innerText;
                selectOptionList.appendChild(valueItem)
            })
            if(!isOldList){
                if (selectedOne && that.autoSelectFirst !== "true") {
                    select.innerText = "";
                    selectedOne = undefined;
                    if (that.changeCallBack) {
                        that.changeCallBack()
                    }
                }else if(that.autoSelectFirst === "true" && that._list.length > 0){
                    setValue(that._list[0].id || that._list[0].name);
                    if (that.changeCallBack) {
                        that.changeCallBack(that._list[0])
                    }
                }
            }
            const loadingDom = that.shadowRoot.querySelector("#loading");
            if (loadingDom) {
                loadingDom.remove();
            }
            inQueryList = false;
            syncWidth();
        }

        function getOptionHeightSum() {
            return Array.from(selectOptionList.querySelectorAll('div')).reduce(function (sum, childDiv) {
                return sum + childDiv.offsetHeight;
            }, 0);
        }

        function checkScroll() {
            if (that.queryMore && !inQueryList && (!that._list || selectOptionList.getBoundingClientRect().height + selectOptionList.scrollTop >= getOptionHeightSum())) {
                inQueryList = true;
                const haveNext = that.queryMore();
                if (haveNext) {
                    selectOptionList.appendChild(loading);
                }
            }
        }

        function open() {
            if (!that.disabled) {
                syncWidth();
                selectorIcon.style.transform = "rotate(-90deg)";
                selector.style.borderRadius = "0.6rem 0.6rem 0 0";
                selectOptionList.style.display = "block";
                checkScroll();
                selectOptionList.addEventListener("scroll", checkScroll);
                selectOptionList.addEventListener('mousedown', selectValue);
            }
        }

        function close() {
            selectorIcon.style.transform = "rotate(0deg)"
            selector.style.borderRadius = "0.6rem"
            selectOptionList.style.display = "none"
            selectOptionList.removeEventListener('mousedown', selectValue)
        }

        selector.addEventListener('click', e => {
            const currentDiv = e.currentTarget;
            if (currentDiv.style.borderRadius === "0.6rem") {
                open()
            } else {
                close()
            }
        });
        selector.addEventListener('blur', e => {
            const currentDiv = e.currentTarget;
            close(currentDiv)
        })

        function setValue(value) {
            select.style.color = "black"
            const divs = selectOptionList.querySelectorAll('div');
            const oldSelected = selectOptionList.querySelector(".selectedOne");
            if (oldSelected) {
                oldSelected.className = "";
            }
            for (let i = 0; i < divs.length; i++) {
                const div = divs[i];
                if (div.id === value) {
                    div.className = "selectedOne";
                    select.innerText = div.innerText;
                }
            }
        }

        function selectValue(e) {
            if (e.target.tagName === 'DIV' && e.target.id && e.target.id !== "selectOptionList") {
                const thisName = e.target.innerText
                const thisValue = e.target.id
                selectedOne = that._list.find(item => {
                    if (item.id && item.id === thisValue) {
                        return true;
                    } else if (!item.id && item.name && item.name === thisName) {
                        return true;
                    }
                })
                setValue(thisValue)
                syncWidth()
                if (that.changeCallBack) {
                    that.changeCallBack(selectedOne)
                }
            }
        }

        //下拉选框宽度矫正
        function syncWidth() {
            selectOptionList.style.width = selector.clientWidth + "px"
        }

        syncWidth();
        window.addEventListener('resize', syncWidth);
    }
}

customElements.define('selector-component', Selector);
