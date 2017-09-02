﻿/*20170902-7023*/
/*components/datagrid.js*/
(function () {

 /*TODO:
2. size (compact, large ??)
5. grouping (multiply)
6. select (выбирается правильно, но теряет фокус при выборе редактора)
7. Доделать checked
8. pager - (client/server)
*/

/*some ideas from https://github.com/andrewcourtice/vuetiful/tree/master/src/components/datatable */

    const utils = require('utils');

    const dataGridTemplate = `
<div class="data-grid-container">
    <slot name="toolbar" />
    <table :class="cssClass">
        <colgroup>
            <col v-if="isMarkCell"/>
            <col v-bind:class="columnClass(col)" v-bind:style="columnStyle(col)" v-for="(col, colIndex) in columns" :key="colIndex"></col>
        </colgroup>
        <thead>
            <tr>
                <th v-if="isMarkCell" class="marker"></th>
                <slot></slot>
            </tr>
        </thead>
        <tbody>
            <data-grid-row :cols="columns" v-for="(item, rowIndex) in $items" :row="item" :key="rowIndex" :index="rowIndex" :mark="mark"></data-grid-row>
        </tbody>
		<slot name="footer"></slot>
    </table>
	<slot name="pager"></slot>
</div>
`;

    const dataGridRowTemplate = `
<tr @mouseup.stop.prevent="row.$select()" :class="rowClass" v-on:dblclick.prevent="doDblClick">
    <td v-if="isMarkCell" class="marker">
        <div :class="markClass"></div>
    </td>
    <data-grid-cell v-for="(col, colIndex) in cols" :key="colIndex" :row="row" :col="col" :index="index" />
</tr>`;

    const dataGridColumnTemplate = `
<th :class="cssClass" @click.prevent="doSort">
	<div class="h-holder">
		<i :class="\'fa fa-\' + icon" v-if="icon"></i>
		<slot>{{header || content}}</slot>
	</div>
</th>
`;

    const dataGridColumn = {
        name: 'data-grid-column',
        template: dataGridColumnTemplate,
        props: {
            header: String,
            content: String,
            icon: String,
            id: String,
            align: { type: String, default: 'left' },
            editable: { type: Boolean, default: false },
            validate: String,
            sort: { type: Boolean, default: undefined },
            mark: String,
            width: String
        },
        created() {
            this.$parent.$addColumn(this);
        },
		computed: {
            dir() {
				return this.$parent.sortDir(this.content);
            },
            isSortable() {
                if (!this.content)
                    return false;
                return typeof this.sort === 'undefined' ? this.$parent.isGridSortable : this.sort;
            },
            isUpdateUrl() {
                return !this.$root.inDialog;
            },
			template() {
				return this.id ? this.$parent.$scopedSlots[this.id] : null;
			},
			classAlign() {
				return this.align !== 'left' ? (' text-' + this.align).toLowerCase() : '';
			},
            cssClass() {
                let cssClass = this.classAlign;
                if (this.isSortable) {
                    cssClass += ' sort';
                    if (this.dir)
                        cssClass += ' ' + this.dir;
                }
                return cssClass;
            }
        },
        methods: {
            doSort() {
                if (!this.isSortable)
					return;
				this.$parent.doSort(this.content);
            },
            cellCssClass(row, editable) {
                let cssClass = this.classAlign;
                if (this.mark) {
                    let mark = row[this.mark];
                    if (mark)
                        cssClass += ' ' + mark;
				}
				if (editable)
					cssClass += ' cell-editable';
                return cssClass.trim();
            }
        }
    };
    Vue.component('data-grid-column', dataGridColumn);

    const dataGridCell = {
        functional: true,
        name: 'data-grid-cell',
        props: {
            row: Object,
            col: Object,
            index: Number
        },
        render(h, ctx) {
            //console.warn('render cell');
            let tag = 'td';
            let row = ctx.props.row;
            let col = ctx.props.col;
			let ix = ctx.props.index;
			let cellProps = {
				'class': col.cellCssClass(row, col.editable)
            };

            let childProps = {
                props: {
                    row: row,
                    col: col
                }
            };
            if (col.template) {
                let vNode = col.template(childProps.props);
                return h(tag, cellProps, [vNode]);
            }

            if (!col.content) {
                return h(tag, cellProps);
            }

            let validator = {
                props: ['path', 'item'],
                template: '<validator :path="path" :item="item"></validator>'
            };

            let validatorProps = {
                props: {
                    path: col.validate,
                    item: row
                }
            };

            if (col.editable) {
                /* editable content */
                let child = {
                    props: ['row', 'col', 'align'],
                    /*TODO: control type */
                    template: '<textbox :item="row" :prop="col.content" :align="col.align" ></textbox>'
				};
                return h(tag, cellProps, [h(child, childProps)]);
            }
            /* simple content */
            if (col.content === '$index')
                return h(tag, cellProps, [ix + 1]);

            // Warning: toString() is required.
			// TODO: calc chain f.i. Document.Rows
			let content = utils.toString(row[col.content]);
            let chElems = [content];
            /*TODO: validate ???? */
			if (col.validate) {
                chElems.push(h(validator, validatorProps));
            }
            return h(tag, cellProps, chElems);
        }
    };

    const dataGridRow = {
        name: 'data-grid-row',
        template: dataGridRowTemplate,
        components: {
            'data-grid-cell': dataGridCell
        },
        props: {
            row: Object,
            cols: Array,
            index: Number,
            mark: String
        },
        computed: {
            active() {
                return this.row === this.$parent.selected;
                //return this === this.$parent.rowSelected;
            },
            rowClass() {
                let cssClass = '';
                if (this.active)
                    cssClass += 'active';
                if (this.isMarkRow && this.mark)
                    cssClass += ' ' + this.row[this.mark];
                return cssClass.trim();
            },
            isMarkCell() {
                return this.$parent.isMarkCell;
            },
            markClass() {
               return this.mark ? this.row[this.mark] : '';
            }
        },
        methods: {
            rowSelect() {
                throw new Error("do not call");
                //this.$parent.rowSelected = this;
            },
            doDblClick($event) {
                // deselect text
                if (!this.$parent.dblclick)
                    return;
                window.getSelection().removeAllRanges();
                this.$parent.dblclick();
            }
        }
    };

	Vue.component('data-grid', {
		props: {
			'items-source': [Object, Array],
			border: Boolean,
			grid: String,
			striped: Boolean,
			hover: { type: Boolean, default: false },
			sort: Boolean,
			routeQuery: Object,
			mark: String,
			filterFields: String,
			markStyle: String,
			dblclick: Function
		},
		template: dataGridTemplate,
		components: {
			'data-grid-row': dataGridRow
		},
		data() {
			return {
				columns: [],
				clientItems: null,
				localSort: {
					dir: 'asc',
					order: ''
				}
			};
		},
		computed: {
			$items() {
				return this.clientItems ? this.clientItems : this.itemsSource;
			},
			isMarkCell() {
				return this.markStyle === 'marker' || this.markStyle === 'both';
			},
			isMarkRow() {
				return this.markStyle === 'row' || this.markStyle === 'both';
			},
			cssClass() {
				let cssClass = 'data-grid';
				if (this.border) cssClass += ' border';
				if (this.grid) cssClass += ' grid-' + this.grid.toLowerCase();
				if (this.striped) cssClass += ' striped';
				if (this.hover) cssClass += ' hover';
				return cssClass;
			},
			selected() {
				return this.itemsSource.$selected;
			},
			isGridSortable() {
				return !!this.sort;
			},
			isLocal() {
				return !this.$parent.sortDir;
			}
		},
		watch: {
			localSort: {
				handler() {
					this.doSortLocally();
				},
				deep: true
			}
		},
        methods: {
            $addColumn(column) {
                this.columns.push(column);
            },
            columnClass(column) {
                if (utils.isDefined(column.dir))
                    return {
                        sorted: !!column.dir
                    };
                else
                    return undefined;
            },
            columnStyle(column) {
                return {
                    width: utils.isDefined(column.width) ? column.width : undefined
                };
			},
			doSort(order) {
				// TODO: // collectionView || locally
				if (this.isLocal) {
					if (this.localSort.order === order)
						this.localSort.dir = this.localSort.dir === 'asc' ? 'desc' : 'asc';
					else {
						this.localSort = { order: order, dir: 'asc' };
					}
				} else {
					this.$parent.$emit('sort', order);
				}
			},
			sortDir(order) {
				// TODO: 
				if (this.isLocal)
					return this.localSort.order === order ? this.localSort.dir : undefined;
				else
					return this.$parent.sortDir(order);
			},
            doSortLocally(order)
			{
				let rev = this.localSort.dir === 'desc';
				let sortProp = this.localSort.order;
                let arr = [].concat(this.itemsSource);
                arr.sort((a, b) => {
                    let av = a[sortProp];
                    let bv = b[sortProp];
                    if (av === bv)
                        return 0;
                    else if (av < bv)
                        return rev ? 1 : -1;
                    else
                        return rev ? -1 : 1;
                });
                this.clientItems = arr;
            }
        }
    });

})();