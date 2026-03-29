import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

export interface UploadedDocumentInfo {
  documentId: number;
  fileName: string;
  contentType: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-wrapper">
      <!-- Drop Zone -->
      <div
        class="drop-zone"
        [class.dragover]="isDragging()"
        [class.uploaded]="uploadedDoc()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">

        <input
          #fileInput
          type="file"
          [accept]="accept"
          style="display:none"
          (change)="onFileSelected($event)" />

        @if (uploading()) {
          <div class="upload-state">
            <div class="spinner"></div>
            <p class="upload-label">Uploading…</p>
          </div>
        } @else if (uploadedDoc()) {
          <div class="upload-state success">
            <div class="check-circle">✓</div>
            <p class="upload-label">{{ uploadedDoc()!.fileName }}</p>
            <p class="upload-sub">Document uploaded successfully</p>
            <button class="replace-btn" (click)="replaceFile($event)">Replace file</button>
          </div>
        } @else {
          <div class="upload-state idle">
            <div class="upload-icon">📄</div>
            <p class="upload-label">Drag & drop your document here</p>
            <p class="upload-sub">or <span class="browse-link">browse</span> to choose a file</p>
            <p class="upload-hint">JPEG, PNG or PDF · max {{ maxSizeMB }} MB</p>
          </div>
        }
      </div>

      <!-- Error message -->
      @if (errorMsg()) {
        <div class="upload-error">
          <span>⚠ {{ errorMsg() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .upload-wrapper { width: 100%; }

    .drop-zone {
      border: 2px dashed #A872C2;
      border-radius: 12px;
      padding: 36px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease;
      background: #fafbff;
      min-height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drop-zone:hover, .drop-zone.dragover {
      background: #f0eaff;
      border-color: #7c4aa8;
      transform: scale(1.01);
    }

    .drop-zone.uploaded {
      border-style: solid;
      border-color: #10B981;
      background: #f0fdf4;
    }

    .upload-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }

    .upload-icon { font-size: 40px; }

    .check-circle {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: #10B981;
      color: white;
      font-size: 24px;
      display: flex; align-items: center; justify-content: center;
    }

    .upload-label { font-size: 15px; font-weight: 600; color: #265C98; margin: 0; }
    .upload-sub { font-size: 13px; color: #64748b; margin: 0; }
    .upload-hint { font-size: 12px; color: #94a3b8; margin: 0; }
    .browse-link { color: #A872C2; font-weight: 600; text-decoration: underline; }

    .replace-btn {
      margin-top: 4px;
      padding: 4px 14px;
      border: 1px solid #A872C2;
      border-radius: 20px;
      background: transparent;
      color: #A872C2;
      font-size: 12px;
      cursor: pointer;
    }
    .replace-btn:hover { background: #f0eaff; }

    .spinner {
      width: 36px; height: 36px;
      border: 4px solid #e2e8f0;
      border-top-color: #A872C2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .upload-error {
      margin-top: 8px;
      padding: 10px 16px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      color: #b91c1c;
      font-size: 13px;
    }
  `]
})
export class FileUploadComponent {
  /** Emits uploaded document info so the parent can include documentId in submission. */
  @Output() documentUploaded = new EventEmitter<UploadedDocumentInfo>();

  @Input() maxSizeMB = 10;
  @Input() accept = '.jpg,.jpeg,.png,.pdf';
  @Input() isClaim = false;

  uploadedDoc = signal<UploadedDocumentInfo | null>(null);
  uploading = signal(false);
  isDragging = signal(false);
  errorMsg = signal('');

  private readonly allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

  constructor(private api: ApiService) { }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave() { this.isDragging.set(false); }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  replaceFile(e: MouseEvent) {
    e.stopPropagation();
    this.uploadedDoc.set(null);
    this.errorMsg.set('');
  }

  private processFile(file: File) {
    this.errorMsg.set('');

    // Client-side validation
    if (!this.allowedTypes.includes(file.type)) {
      this.errorMsg.set('Invalid file type. Please upload a JPEG, PNG, or PDF.');
      return;
    }
    if (file.size > this.maxSizeMB * 1_048_576) {
      this.errorMsg.set(`File is too large. Maximum size is ${this.maxSizeMB} MB.`);
      return;
    }

    this.uploading.set(true);
    const uploadObs = this.isClaim ? this.api.uploadClaimDocument(file) : this.api.uploadDocument(file);

    uploadObs.subscribe({
      next: (res) => {
        this.uploading.set(false);
        const info: UploadedDocumentInfo = {
          documentId: res.documentId,
          fileName: res.fileName,
          contentType: res.contentType
        };
        this.uploadedDoc.set(info);
        this.documentUploaded.emit(info);
      },
      error: (err) => {
        this.uploading.set(false);
        const msg = err?.error?.message ?? 'Upload failed. Please try again.';
        this.errorMsg.set(msg);
      }
    });
  }
}
