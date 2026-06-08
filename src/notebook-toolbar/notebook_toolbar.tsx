import { Notebook, NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import { ReactWidget, HTMLSelect } from '@jupyterlab/ui-components';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import React from 'react';
/**
 * The class name added to toolbar cell type dropdown wrapper.
 */
const TOOLBAR_CELLTYPE_CLASS = 'jp-Notebook-toolbarCellType';

/**
 * The class name added to toolbar cell type dropdown.
 */
const TOOLBAR_CELLTYPE_DROPDOWN_CLASS = 'jp-Notebook-toolbarCellTypeDropdown';

/**
 * A toolbar widget that switches cell types.
 */
export class CellTypeSwitcher extends ReactWidget {
  /**
   * Construct a new cell type switcher.
   */
  constructor(widget: Notebook, translator?: ITranslator) {
    super();
    this._trans = (translator || nullTranslator).load('jupyterlab');
    this.addClass(TOOLBAR_CELLTYPE_CLASS);
    this._notebook = widget;
    if (widget.model) {
      this.update();
    }
    widget.activeCellChanged.connect(this.update, this);
    // Follow a change in the selection.
    widget.selectionChanged.connect(this.update, this);
  }

  /**
   * Handle `change` events for the HTMLSelect component.
   */
  handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    let foundNbgraderCells = false;
    this._notebook.widgets.forEach((child, index) => {
      if (this._notebook.isSelectedOrActive(child)) {
        const cell = this._notebook.model?.cells.get(index);
        if (cell === undefined) {
          return;
        }
        const isNbgraderCell = !!cell.getMetadata('nbgrader');
        foundNbgraderCells ||= isNbgraderCell;
      }
    });
    if (foundNbgraderCells) {
      void showDialog({
        title: this._trans.__('Cell Type Change Not Allowed'),
        body: this._trans.__(
          "One or more selected cells belong to the assignment and can't be changed!"
        ),
        buttons: [Dialog.okButton({ label: this._trans.__('Ok') })]
      });
    }
    if (!foundNbgraderCells && event.target.value !== '-') {
      NotebookActions.changeCellType(this._notebook, event.target.value);
      this._notebook.activate();
    }
  };

  /**
   * Handle `keydown` events for the HTMLSelect component.
   */
  handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this._notebook.activate();
    }
  };

  render(): JSX.Element {
    let value = '-';
    if (this._notebook.activeCell) {
      value = this._notebook.activeCell.model.type;
    }
    for (const widget of this._notebook.widgets) {
      if (this._notebook.isSelectedOrActive(widget)) {
        if (widget.model.type !== value) {
          value = '-';
          break;
        }
      }
    }
    return (
      <HTMLSelect
        className={TOOLBAR_CELLTYPE_DROPDOWN_CLASS}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
        value={value}
        aria-label={this._trans.__('Cell type')}
        title={this._trans.__('Select the cell type')}
      >
        <option value="-">-</option>
        <option value="code">{this._trans.__('Code')}</option>
        <option value="markdown">{this._trans.__('Markdown')}</option>
        <option value="raw">{this._trans.__('Raw')}</option>
      </HTMLSelect>
    );
  }

  private readonly _trans: TranslationBundle;
  private readonly _notebook: Notebook;
}

export namespace ToolbarItems {
  export function createCellTypeItem(
    panel: NotebookPanel,
    translator?: ITranslator
  ): ReactWidget {
    const switcher = new CellTypeSwitcher(panel.content, translator);
    return switcher;
  }
}
