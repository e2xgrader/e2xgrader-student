import { NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { ITranslator } from '@jupyterlab/translation';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { SemanticCommand, Clipboard } from '@jupyterlab/apputils';
import * as nbformat from '@jupyterlab/nbformat';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

// Get the current widget and activate unless the args specify otherwise.
function getCurrent(
  tracker: INotebookTracker,
  shell: JupyterFrontEnd.IShell,
  args: ReadonlyPartialJSONObject
): NotebookPanel | null {
  const widget = args[SemanticCommand.WIDGET]
    ? (tracker.find(panel => panel.id === args[SemanticCommand.WIDGET]) ?? null)
    : tracker.currentWidget;
  const activate = args['activate'] !== false;

  if (activate && widget) {
    shell.activateById(widget.id);
  }

  return widget;
}

export const commandIDs = {
  maybeToMarkdown: 'e2xgrader:change-cell-to-markdown',
  maybePasteCellBelow: 'e2xgrader:paste-cell-below',
  maybePasteCellAbove: 'e2xgrader:paste-cell-above',
  maybePasteCellAndReplace: 'e2xgrader:paste-and-replace-cell',
  maybeMoveUp: 'e2xgrader:move-cell-up',
  maybeMoveDown: 'e2xgrader:move-cell-down',
  maybeDuplicateBelow: 'e2xgrader:duplicate-below',
  maybeMerge: 'e2xgrader:merge-cells',
  maybeSplit: 'e2xgrader:split-cell-at-cursor',
  maybeInsertCellBelow: 'e2xgrader:insert-cell-below',
  maybeInsertCellAbove: 'e2xgrader:insert-cell-above'
};

const replacedCommands = {
  toMarkdown: {
    original_id: 'notebook:change-cell-to-markdown',
    new_id: commandIDs.maybeToMarkdown
  },
  moveUp: {
    original_id: 'notebook:move-cell-up',
    new_id: commandIDs.maybeMoveUp
  },
  moveDown: {
    original_id: 'notebook:move-cell-down',
    new_id: commandIDs.maybeMoveDown
  },
  duplicateBelow: {
    original_id: 'notebook:duplicate-below',
    new_id: commandIDs.maybeDuplicateBelow
  },
  merge: {
    original_id: 'notebook:merge-cells',
    new_id: commandIDs.maybeMerge
  },
  split: {
    original_id: 'notebook:split-cell-at-cursor',
    new_id: commandIDs.maybeSplit
  }
};

const clipboardCommands = {
  pasteCellBelow: {
    original_id: 'notebook:paste-cell-below',
    new_id: commandIDs.maybePasteCellBelow
  },
  pasteCellAbove: {
    original_id: 'notebook:paste-cell-above',
    new_id: commandIDs.maybePasteCellAbove
  },
  pasteCellAndReplace: {
    original_id: 'notebook:paste-and-replace-cell',
    new_id: commandIDs.maybePasteCellAndReplace
  }
};

const settingCommands = {
  insertCellBelow: {
    original_id: 'notebook:insert-cell-below',
    new_id: commandIDs.maybeInsertCellBelow
  },
  insertCellAbove: {
    original_id: 'notebook:insert-cell-above',
    new_id: commandIDs.maybeInsertCellAbove
  }
};

function shouldExecuteCommand(current: NotebookPanel | null): boolean {
  if (!current?.content.model || !current?.content.activeCell) {
    return false;
  }
  let foundNbgraderCells = false;
  const notebook = current.content;
  notebook.widgets.forEach((child, index) => {
    if (notebook.isSelectedOrActive(child)) {
      const cell = notebook.model?.cells.get(index);
      if (cell === undefined) {
        return;
      }
      const isNbgraderCell = !!cell.getMetadata('nbgrader');
      foundNbgraderCells ||= isNbgraderCell;
    }
  });
  console.log('Did we find nbgrader cells?', foundNbgraderCells);
  return !foundNbgraderCells;
}

/**
 * Whether there is an active notebook.
 */
export function hasActiveNotebook(
  shell: JupyterFrontEnd.IShell,
  tracker: INotebookTracker
): boolean {
  return (
    tracker.currentWidget !== null &&
    tracker.currentWidget === shell.currentWidget
  );
}

export function sanitizeClipboard() {
  const JUPYTER_CELL_MIME = 'application/vnd.jupyter.cells';
  const clipboard = Clipboard.getInstance();
  if (!clipboard.hasData(JUPYTER_CELL_MIME)) {
    return;
  }
  const cells = clipboard.getData(JUPYTER_CELL_MIME) as nbformat.IBaseCell[];
  const sanitizedCells: nbformat.IBaseCell[] = [];
  cells.forEach((cell: nbformat.IBaseCell, index: number) => {
    if (!cell.metadata.nbgrader) {
      sanitizedCells.push(cell);
    }
  });
  clipboard.setData(JUPYTER_CELL_MIME, sanitizedCells);
}

export function registerCommands(
  app: JupyterFrontEnd,
  tracker: INotebookTracker,
  _translator: ITranslator,
  settings: ISettingRegistry.ISettings
): void {
  const { commands, shell } = app;
  console.log('Command registry', commands);
  // Iterate over the replaced commands and register them.
  Object.values(replacedCommands).forEach(command => {
    commands.addCommand(command.new_id, {
      label: args => commands.label(command.original_id, args),
      execute: args => {
        console.log(`Executing command: ${command.new_id} with args:`, args);
        const current = getCurrent(tracker, shell, args);
        if (!shouldExecuteCommand(current)) {
          return;
        }
        commands.execute(command.original_id, args);
      },
      isEnabled: args => commands.isEnabled(command.original_id, args),
      caption: args => commands.caption(command.original_id, args),
      icon: args => commands.icon(command.original_id, args),
      isVisible: args => {
        const current = getCurrent(tracker, shell, args);
        return current !== null && shouldExecuteCommand(current);
      }
    });
  });
  // Iterate over the clipboard commands and register them.
  Object.values(clipboardCommands).forEach(command => {
    commands.addCommand(command.new_id, {
      label: args => commands.label(command.original_id, args),
      execute: args => {
        console.log(`Executing command: ${command.new_id} with args:`, args);
        sanitizeClipboard();
        commands.execute(command.original_id, args);
      },
      isEnabled: args => commands.isEnabled(command.original_id, args),
      icon: args => commands.icon(command.original_id, args)
    });
  });
  // Iterate over the setting commands and register them.
  Object.values(settingCommands).forEach(command => {
    commands.addCommand(command.new_id, {
      label: args => commands.label(command.original_id, args),
      execute: args => {
        console.log(`Executing command: ${command.new_id} with args:`, args);
        const current = getCurrent(tracker, shell, args);
        if (
          !shouldExecuteCommand(current) ||
          !settings.get('allow_insert_cell').composite
        ) {
          return;
        }
        commands.execute(command.original_id, args);
      },
      isEnabled: args => commands.isEnabled(command.original_id, args),
      caption: args => commands.caption(command.original_id, args),
      icon: args => commands.icon(command.original_id, args),
      isVisible: args => {
        const current = getCurrent(tracker, shell, args);
        return (
          current !== null &&
          (settings.get('allow_insert_cell').composite as boolean)
        );
      }
    });
  });
}
