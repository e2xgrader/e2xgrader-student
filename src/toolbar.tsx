import { E2xGraderCellToolbar, E2xGraderCellRegistry } from '@e2xgrader/core';
import { Toolbar, lockIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import React from 'react';
import { TranslationBundle } from '@jupyterlab/translation';

export class StudentCellToolbar extends E2xGraderCellToolbar.CellToolbar {
  constructor(
    options: Toolbar.IOptions,
    registry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined
  ) {
    super(options, registry);
    this.addClass('e2xgrader-StudentCellToolbar');
    this.hide();
  }

  protected onAfterAttach(_msg: Message): void {
    super.onAfterAttach(_msg);
    const model = this.gradingCellModel;
    if (model?.isNbgraderCell) {
      this.show();
    }
    if (model?.isSolution) {
      this.addClass('e2xgrader-SolutionCell');
    }
    if (model?.isDescription) {
      this.addClass('e2xgrader-ReadOnlyCell');
    }
  }
}

export namespace StudentCellToolbar {
  export class CellLabel extends E2xGraderCellToolbar.ToolbarElement {
    constructor(
      toolbar: E2xGraderCellToolbar.CellToolbar,
      private _trans: TranslationBundle
    ) {
      super(toolbar);
    }

    determinePointsLabel(): string {
      const points = this.gradingCellModel?.points;
      if (points !== undefined) {
        return this._trans._n('%1 Point', '%1 Points', points);
      }
      return '';
    }

    determineLabel(): string {
      if (this.gradingCellModel?.isAutograderTest) {
        return this._trans.__('Autograder Test');
      }
      if (this.gradingCellModel?.isTask) {
        return this._trans.__('Task');
      }
      const cell_type = this.gradingCellModel?.gradingCellType ?? '';
      if (this.gradingCellModel?.isE2xgraderCell) {
        const label = this.cellRegistry?.getPluginLabel(cell_type) ?? cell_type;
        return this._trans.__(`${label} Answer`);
      }
      const original_cell_type = this.cell?.model.sharedModel.cell_type;
      if (original_cell_type === 'code') {
        return this._trans.__('Code Answer');
      } else if (original_cell_type === 'markdown') {
        return this._trans.__('Text Answer');
      }
      return '';
    }

    renderElement(): React.JSX.Element {
      const isReadOnly = this.gradingCellModel?.isDescription;
      return (
        <div className="e2xgrader-CellLabel">
          <div className="e2xgrader-CellType">
            {isReadOnly ? (
              <lockIcon.react className="e2xgrader-LockIcon" />
            ) : (
              this.determineLabel()
            )}
          </div>
          <div className="e2xgrader-Spacer"></div>
          <div className="e2xgrader-PointsLabel">
            {this.determinePointsLabel()}
          </div>
        </div>
      );
    }
  }

  export function createStudentCellToolbar(
    registry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined,
    trans: TranslationBundle
  ): StudentCellToolbar {
    const toolbar = new StudentCellToolbar({}, registry);
    toolbar.addItem('label', new CellLabel(toolbar, trans));
    return toolbar;
  }
}
