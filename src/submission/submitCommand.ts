import { CommandRegistry } from '@lumino/commands';
import { paperPlaneIcon, spinnerIcon } from '../icons';
import { LabIcon } from '@jupyterlab/ui-components';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
import { SUBMIT_COMMAND_ID } from '../index';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import {
  INbGraderAssignment,
  INbGraderNotebook,
  IE2xGraderSubmissionResponse
} from '@e2xgrader/core';
import { SubmissionConfirmationWidget } from './submissionConfirmationWidget';
import { TranslationBundle } from '@jupyterlab/translation';
import { JupyterFrontEnd } from '@jupyterlab/application';
import {AssignmentListAPI} from "@e2xgrader/core";

export const SUBMITTABLE_NOTEBOOK_META_KEY = 'e2xGrader';
export const SUBMISSION_CONFIRMATION_BUTTON_CLASS =
  'e2x-submission-confirmation-button';
export const SUBMISSION_REJECTION_BUTTON_CLASS =
  'e2x-submission-rejection-button';

export class SubmitCommand implements CommandRegistry.ICommandOptions {
  label: string = this.trans.__('Submit');
  caption: string = this.trans.__('Submit notebook');
  icon = (): LabIcon => {
    return this.submitting ? spinnerIcon : paperPlaneIcon;
  };
  iconClass: string = 'reduce-icon-size';
  _fetchedAssignments: INbGraderAssignment[] = [];
  private tracker?: INotebookTracker;
  static instanceId: number = 0;
  private submitting: boolean = false;

  constructor(
    private app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    private trans: TranslationBundle
  ) {
    this.tracker = notebookTracker;
    this.tracker.widgetAdded.connect(
      (tracker: INotebookTracker, widget: NotebookPanel) => {
        this.loadFetchedAssignments().then(() => {
          this.updateSubmitButtons();
        });
      }
    );
    this.tracker.currentChanged.connect(
      (tracker: INotebookTracker, widget: NotebookPanel | null) => {
        this.updateSubmitButtons();
      }
    );
  }

  private updateSubmitButtons = (): void => {
    this.app.commands.notifyCommandChanged(SUBMIT_COMMAND_ID);
  };

  isVisible = (): boolean => {
    return (
      this.tracker?.currentWidget?.model?.metadata[
        SUBMITTABLE_NOTEBOOK_META_KEY
      ] !== undefined
    );
  };

  isEnabled = (): boolean => {
    if (this.submitting) {
      return false;
    }
    return !!this.findAssignment(
      this.tracker?.currentWidget?.context.localPath ?? ''
    );
  };

  private getCurrentNotebookPath = (): string | undefined => {
    return this.tracker?.currentWidget?.context.localPath;
  };

  private async loadFetchedAssignments(): Promise<void> {
    this._fetchedAssignments = [];
    await AssignmentListAPI.fetchCourses().then(async courses =>
      Promise.all(
        courses.map(async courseId => {
          await AssignmentListAPI.fetchAssignments(courseId).then(assignments => {
            this._fetchedAssignments.push(
              ...assignments.filter(
                assignment => assignment.status === 'fetched' || assignment.status === 'submitted'
              )
            );
          });
        })
      )
    );
  }

  private findAssignment = (path: string): INbGraderAssignment | undefined => {
    return this._fetchedAssignments.find(assignment =>
      assignment.notebooks.some(
        (notebook: INbGraderNotebook) => notebook.path === path
      )
    );
  };

  private blockSubmitButton = (): void => {
    this.submitting = true;
    this.updateSubmitButtons();
  };

  private unblockSubmitButton = (): void => {
    this.submitting = false;
    this.updateSubmitButtons();
  };

  execute = async (): Promise<void> => {
    this.blockSubmitButton();
    const notebookPath: string | undefined = this.getCurrentNotebookPath();
    if (!notebookPath) {
      console.warn(
        "unable to identify the current notebook's path -> unable to submit"
      );
      this.unblockSubmitButton();
      return;
    }
    const assignment: INbGraderAssignment | undefined = this.findAssignment(notebookPath);
    if (!assignment) {
      console.warn(
        'notebook seems not to be part of any assignment -> unable to submit'
      );
      this.unblockSubmitButton();
      return;
    }

    const settings = ServerConnection.makeSettings();

    AssignmentListAPI.submitAssignment(assignment.course_id, assignment.assignment_id)
      .then((response: IE2xGraderSubmissionResponse) => {
          console.log('notebook has been submitted');
          if (response.hashcode && response.timestamp) {
            this.showConfirmationDialog(
              response.timestamp as string,
              URLExt.join(
                settings.baseUrl,
                'view',
                notebookPath.replace('.ipynb', '_hashcode.html')
              )
            );
          }
          this.unblockSubmitButton();
      })
      .catch((error: Error|ServerConnection.NetworkError) => {
        this.unblockSubmitButton();
        alert('failed to submit notebook');
        throw error;
      });
  };

  private showConfirmationDialog(timestamp: string, hashcodeUrl: string): void {
    showDialog({
      title: this.trans.__('Exam submission successful'),
      body: new SubmissionConfirmationWidget(this.trans, timestamp),
      buttons: [
        Dialog.cancelButton({
          label: this.trans.__('No, continue working on the exam'),
          className: SUBMISSION_REJECTION_BUTTON_CLASS
        }),
        Dialog.okButton({
          label: this.trans.__('Yes, exit exam'),
          className: SUBMISSION_CONFIRMATION_BUTTON_CLASS
        })
      ]
    }).then(result => {
      if (result.button.accept) {
        window.location.href = hashcodeUrl;
      }
    });
  }
}
