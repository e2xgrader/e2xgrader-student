import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';
import { E2XContentFactoryStudent } from './factory';
import {
  E2xGraderCellRegistry,
  ExtendedToolbarWidgetRegistry,
  PRIMARY_NOTEBOOK_TOOLBAR_FACTORY_ID
} from '@e2xgrader/core';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';
import { registerCommands } from './commands';
import { IToolbarWidgetRegistry, ICommandPalette } from '@jupyterlab/apputils';
import { ToolbarItems } from './notebook-toolbar/notebook_toolbar';
import { SubmitCommand } from './submission/submitCommand';
import { SharedMaterialsWidget } from './notebook-toolbar/SharedMaterialsWidget';
import { OpenSharedMaterialCommand } from './notebook-toolbar/openSharedMaterialCommand';

export const SUBMIT_COMMAND_ID = 'e2xgrader:submit-notebook';

/**
 * Initialization data for the @e2xgrader/student extension.
 */
const cellFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> =
  {
    id: '@e2xgrader/student:plugin',
    description: 'A JupyterLab extension for e2xgrader student mode',
    autoStart: true,
    requires: [IEditorServices, E2xGraderCellRegistry.IE2xGraderCellRegistry],
    optional: [ITranslator],
    provides: NotebookPanel.IContentFactory,
    activate: (
      _app: JupyterFrontEnd,
      editorServices: IEditorServices,
      cellRegistry: E2xGraderCellRegistry.IE2xGraderCellRegistry,
      translator?: ITranslator
    ) => {
      console.log(
        'JupyterLab extension @e2xgrader/student:plugin is activated!'
      );

      const trans = (translator ?? nullTranslator).load('e2xgrader_student');

      const editorFactory = editorServices.factoryService.newInlineEditor;
      const contentFactory = new E2XContentFactoryStudent(
        {
          editorFactory
        },
        undefined,
        cellRegistry,
        trans
      );
      return contentFactory;
    }
  };

const studentCommandsPlugin: JupyterFrontEndPlugin<void> = {
  id: '@e2xgrader/student:commands',
  description: 'A JupyterLab extension for e2xgrader student mode',
  autoStart: true,
  requires: [
    ITranslator,
    INotebookTracker,
    IToolbarWidgetRegistry,
    ISettingRegistry
  ],
  activate: async (
    app: JupyterFrontEnd,
    translator: ITranslator,
    tracker: INotebookTracker,
    toolbarRegistry: IToolbarWidgetRegistry,
    settingRegistry: ISettingRegistry
  ) => {
    console.log(
      'JupyterLab extension @e2xgrader/student:commands is activated!'
    );
    const settings = await settingRegistry.load(studentCommandsPlugin.id);
    registerCommands(app, tracker, translator, settings);
    toolbarRegistry.addFactory<NotebookPanel>(
      'Notebook',
      'e2xCellType',
      panel => ToolbarItems.createCellTypeItem(panel, translator)
    );
  }
};

/**
 * Initialization data for the @e2xgrader/student:submit-command extension.
 */
export const submitCommandPlugin: JupyterFrontEndPlugin<void> = {
  id: '@e2xgrader/student:submit-command',
  description: 'adds a submit command.',
  requires: [INotebookTracker, ICommandPalette, ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    commandPalette: ICommandPalette,
    translator: ITranslator
  ) => {
    console.log(
      'JupyterLab extension @e2xgrader/student:submit-command is activated!'
    );
    const trans = translator.load('e2xgrader_student');
    app.commands.addCommand(
      SUBMIT_COMMAND_ID,
      new SubmitCommand(app, notebookTracker, trans)
    );
    commandPalette.addItem({
      command: SUBMIT_COMMAND_ID,
      category: 'e2xgrader'
    });
  }
};

/**
 * Initialization data for the @e2xgrader/student:shared-materials-widget extension.
 */
export const sharedMaterialsWidgetPlugin: JupyterFrontEndPlugin<void> = {
  id: '@e2xgrader/student:shared-materials-widget',
  description:
    'adds a toolbar widget, to offer shared materials/additional resources.',
  requires: [IToolbarWidgetRegistry, ICommandPalette],
  optional: [ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    toolbarWidgetRegistry: IToolbarWidgetRegistry,
    commandPalette: ICommandPalette,
    translator?: ITranslator
  ) => {
    console.log(
      'JupyterLab extension @e2xgrader/student:shared-materials-widget is activated!'
    );

    const trans = (translator ?? nullTranslator).load('e2xgrader_student');

    app.commands.addCommand(
      OpenSharedMaterialCommand.COMMAND_ID,
      new OpenSharedMaterialCommand(app, trans)
    );

    commandPalette.addItem({
      command: OpenSharedMaterialCommand.COMMAND_ID,
      category: 'e2xgrader'
    });

    (
      toolbarWidgetRegistry as ExtendedToolbarWidgetRegistry
    ).addFactory<NotebookPanel>(
      PRIMARY_NOTEBOOK_TOOLBAR_FACTORY_ID,
      SharedMaterialsWidget.WIDGET_ID,
      (toolbar, toolbarItem) =>
        new SharedMaterialsWidget(trans, app.commands, toolbarItem)
    );
  }
};

export default [
  cellFactoryPlugin,
  studentCommandsPlugin,
  submitCommandPlugin,
  sharedMaterialsWidgetPlugin
];
