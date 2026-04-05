import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  features = [
    { icon: 'assignment', title: 'Permit Management', desc: 'Multi-level safety permit workflows with 13 permit types, real-time tracking, and multi-department approval chains.', color: '#3b82f6' },
    { icon: 'inventory_2', title: 'Inventory & Procurement', desc: 'End-to-end purchase orders, invoicing, quotations, ASN, supplier and customer management.', color: '#8b5cf6' },
    { icon: 'directions_car', title: 'Vehicle & Fleet', desc: 'Fleet tracking, fuel consumption logs, maintenance scheduling, driver management, gate entry/exit.', color: '#06b6d4' },
    { icon: 'health_and_safety', title: 'Safety Management', desc: 'Incident reporting, safety inspections, PPE inventory tracking, and training records management.', color: '#10b981' },
    { icon: 'badge', title: 'Visitor Management', desc: 'Pre-approved visits, check-in/out automation, visitor pass generation, blacklist control.', color: '#f59e0b' },
    { icon: 'meeting_room', title: 'Reception & Stationery', desc: 'Front desk operations, meeting room booking, parcel management, office supplies requisition.', color: '#f43f5e' },
  ];

  stats = [
    { value: '7+', label: 'Enterprise Modules' },
    { value: '13', label: 'Permit Types' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '24/7', label: 'Support' },
  ];
}
