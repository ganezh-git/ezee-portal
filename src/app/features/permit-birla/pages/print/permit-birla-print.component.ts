import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-permit-birla-print',
  standalone: true,
  imports: [],
  templateUrl: './permit-birla-print.component.html',
  styleUrl: './permit-birla-print.component.scss',
})
export class PermitBirlaPrintComponent implements OnInit {
  permit: any = null;
  loading = true;

  // Master lists for checkbox rendering
  allHazards = [
    { code: 'CORROSIVE', label: 'Corrosive chemical' }, { code: 'HOT_MAT', label: 'Hot Materials' },
    { code: 'HIGH_LOW_TEMP', label: 'High/Low Temp.' }, { code: 'TRAFFIC', label: 'Traffic' }, { code: 'FRAGILE_ROOF', label: 'Fragile roof' },
    { code: 'FLAMMABLES', label: 'Flammables' }, { code: 'STEAM', label: 'Steam' }, { code: 'LIVE_ELEC', label: 'Live Electrical' },
    { code: 'CONFINED_SPACE', label: 'Confined space' }, { code: 'LONE_WORK', label: 'Lone work' },
    { code: 'EXPLOSIVES', label: 'Explosives' }, { code: 'COMPRESSED_GAS', label: 'Compressed gases' },
    { code: 'OVERHEAD', label: 'Overhead Danger' }, { code: 'LACK_O2', label: 'Lack of oxygen' }, { code: 'BURIED_CABLES', label: 'Buried cables' },
    { code: 'FUMES_DUST', label: 'Fumes/dust' }, { code: 'MOVING_MACHINE', label: 'Moving machine' },
    { code: 'SCAFFOLD', label: 'Use of scaffold' }, { code: 'BURIED_PIPES', label: 'Buried pipelines' },
    { code: 'HIGH_LOW_PRESS', label: 'High/Low Pressure' }, { code: 'AUTO_START', label: 'Auto-start equip.' },
    { code: 'UNSAFE_ACCESS', label: 'Unsafe access' }, { code: 'OTHER', label: 'Other (specify)' },
  ];

  allPpe = [
    { code: 'HELMET', label: 'Helmet' }, { code: 'GLOVE_ELEC', label: 'Handglove (Elect)' }, { code: 'APRON', label: 'Apron' },
    { code: 'GAS_MASK', label: 'Gas Mask' }, { code: 'CRAWLING_BOARD', label: 'Crawling Board' },
    { code: 'SAFETY_SHOES', label: 'Safety shoes' }, { code: 'GLOVE_OTHER', label: 'Handglove (other)' },
    { code: 'PVC_OVERALL', label: 'PVC Overall' }, { code: 'SCBA', label: 'SCBA' },
    { code: 'GUM_BOOTS', label: 'Gum boots' }, { code: 'GOGGLES', label: 'Safety goggles' },
    { code: 'EAR_PLUG', label: 'Ear Plugs / Muffs' }, { code: 'SAFETY_BELT', label: 'Safety Belt' }, { code: 'OTHER', label: 'Other (specify)' },
    { code: 'GLOVE_PVC', label: 'Handglove (PVC)' }, { code: 'FACE_SHIELD', label: 'Face shield' },
    { code: 'DUST_MASK', label: 'Dust Mask' }, { code: 'SAFETY_NET', label: 'Safety net' },
  ];

  precautionChecks = [
    { key: 'prec_site_checked', label: 'Job site checked' },
    { key: 'prec_area_cordoned', label: 'Area cordoned' },
    { key: 'prec_caution_boards', label: 'Caution boards displayed' },
    { key: 'prec_elcb_portable', label: 'ELCB for portable tools' },
    { key: 'prec_ppe_provided', label: 'PPE provided' },
    { key: 'prec_lifting_certified', label: 'Lifting tools certified' },
    { key: 'prec_supervision', label: 'Supervision provided' },
    { key: 'prec_adequate_ventilation', label: 'Adequate Ventilation' },
    { key: 'prec_combustibles_removed', label: 'Combustibles removed' },
    { key: 'prec_sparks_isolated', label: 'Sparks isolated' },
    { key: 'prec_explosion_test', label: 'Explosion test done' },
    { key: 'prec_repeat_explosion', label: 'Repeat test required' },
    { key: 'prec_firefighting_equip', label: 'Fire fighting equip provided' },
    { key: 'prec_firefighters_alerted', label: 'Fire fighters alerted' },
    { key: 'prec_welding_earthed', label: 'Welding sets earthed' },
    { key: 'prec_welding_cable_ok', label: 'Welding cable OK' },
    { key: 'prec_underground_cables', label: 'Underground cables checked' },
    { key: 'prec_underground_pipes', label: 'Underground pipes checked' },
    { key: 'prec_shoring', label: 'Shoring arrangement done' },
    { key: 'prec_method_statement', label: 'Method statement for >1.8M' },
  ];

  closureItems = [
    { key: 'A', label: 'Debris, tools and tackles are removed from the area and the area is cleaned and ready for handover to the user department' },
    { key: 'B', label: 'Tools and tackles are removed' },
    { key: 'C', label: 'All solvent pipelines shall be fitted with jumpers' },
    { key: 'D', label: 'LOTOTO has been removed & Electricity is restored' },
    { key: 'E', label: 'Equipment is ready for operation' },
    { key: 'F', label: 'If work is not completed Area shall be cordoned off (by Plant Engineering dept)' },
  ];

  constructor(private route: ActivatedRoute, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get(`${environment.apiUrl}/permit-birla/permits/${id}`).subscribe({
        next: (data: any) => { this.permit = data; this.loading = false; this.cdr.markForCheck(); },
        error: () => { this.loading = false; this.cdr.markForCheck(); },
      });
    } else {
      // Blank permit for printing
      this.permit = {};
      this.loading = false;
    }
  }

  hasHazard(code: string): boolean {
    return this.permit?.hazards?.some((h: any) => h.code === code) || false;
  }

  hasPpe(code: string): boolean {
    return this.permit?.ppe?.some((p: any) => p.code === code) || false;
  }

  getPrec(key: string): boolean {
    return !!this.permit?.[key];
  }

  print(): void {
    window.print();
  }

  get workingGroupList(): string[] {
    if (!this.permit?.working_group_members) return [];
    try { return JSON.parse(this.permit.working_group_members); } catch { return []; }
  }
}
