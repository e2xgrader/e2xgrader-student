import { Cell, ICellHeader } from '@jupyterlab/cells';
import { E2XContentFactory, E2xGraderCellRegistry } from '@e2xgrader/core';
import { StudentCellToolbar } from './toolbar';
import { Notebook } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { TranslationBundle } from '@jupyterlab/translation';

export class NotebookWithoutFooter extends Notebook {
  protected addFooter(): void {
    // Override to prevent adding a footer
  }
}

export class E2XContentFactoryStudent extends E2XContentFactory {
  constructor(
    options: Cell.ContentFactory.IOptions,
    settings: ISettingRegistry.ISettings | undefined,
    registry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined,
    private _trans: TranslationBundle
  ) {
    super(options, settings, registry);
  }

  createCellHeader(): ICellHeader {
    return StudentCellToolbar.createStudentCellToolbar(
      this.cellRegistry,
      this._trans
    );
  }

  /**
   * Creates a new notebook instance without the footer that allows adding new cells.
   *
   * @remarks
   * This method overrides the default notebook creation to use a custom notebook
   * implementation (`NotebookWithoutFooter`) that removes the footer UI element.
   * The footerprovides controls for adding new cells, which we disable
   * to prevent students from adding cells via the interface.
   *
   * @param options - The options used to initialize the notebook.
   * @returns A notebook instance without the footer for adding new cells.
   */
  createNotebook(options: Notebook.IOptions): Notebook {
    return new NotebookWithoutFooter(options);
  }
}
