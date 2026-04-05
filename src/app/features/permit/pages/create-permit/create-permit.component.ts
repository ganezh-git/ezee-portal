import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PermitService } from '../../services/permit.service';
import { PermitType, PermitLocation } from '../../models/permit.models';

@Component({
  selector: 'app-create-permit',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-permit.component.html',
  styleUrl: './create-permit.component.scss',
})
export class CreatePermitComponent implements OnInit {
  permitForm!: FormGroup;
  permitTypes: PermitType[] = [];
  locations: PermitLocation[] = [];
  loading = false;
  error = '';
  success = '';
  currentStep = 1;
  totalSteps = 3;

  constructor(
    private fb: FormBuilder,
    private permitService: PermitService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.permitForm = this.fb.group({
      type: ['', Validators.required],
      location: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]],
      expectedStart: ['', Validators.required],
      expectedEnd: ['5:00pm'],
      mode: ['Normal', Validators.required],
      fireGuard: ['Fire Guard Not Required'],
    });

    this.permitService.getTypes().subscribe(types => { this.permitTypes = types; this.cdr.markForCheck(); });
    this.permitService.getLocations().subscribe(locs => { this.locations = locs.filter(l => l.locks !== 'Locked'); this.cdr.markForCheck(); });

    // Default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.permitForm.patchValue({ expectedStart: tomorrow.toISOString().slice(0, 10) });
  }

  get selectedType(): PermitType | undefined {
    return this.permitTypes.find(t => t.value === this.permitForm.get('type')?.value);
  }

  get isHotWork(): boolean {
    return this.permitForm.get('type')?.value === 'hot_permit';
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  canProceed(): boolean {
    if (this.currentStep === 1) {
      return !!this.permitForm.get('type')?.value && !!this.permitForm.get('mode')?.value;
    }
    if (this.currentStep === 2) {
      return !!this.permitForm.get('location')?.value && !!this.permitForm.get('description')?.value && !!this.permitForm.get('expectedStart')?.value;
    }
    return true;
  }

  onSubmit(): void {
    if (this.permitForm.invalid) return;
    this.loading = true;
    this.error = '';

    this.permitService.createPermit(this.permitForm.value).subscribe({
      next: (result) => {
        this.loading = false;
        this.success = `Permit #${result.id} created successfully! Status: ${result.status}`;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.router.navigate(['/permit/my-permits']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Failed to create permit';
        this.cdr.markForCheck();
      },
    });
  }
}
