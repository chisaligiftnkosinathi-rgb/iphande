# VBA BRIDGE V1

## Purpose
To define the proper role of VBA and Excel within the iPhande ecosystem. It acts as an analytical and reporting bridge, not as a primary data generator.

## The Doctrine
> The app remains the truth engine. VBA becomes a helper, not the foundation.

## Allowed Use Cases
VBA is strictly reserved for:
- Excel dashboards
- Offline reports
- Admin consoles
- Bulk exports
- Accounting summaries

## The Data Flow
1. iPhande backend serves export-ready data (`JSON`, `CSV`, or basic `Excel` dumps).
2. The VBA Bridge consumes this data to generate high-level insights.

## Strict Boundary
VBA is **never** the source of truth. It does not store original records, nor does it generate the official operational documents (Quotes, Invoices, Proof of Work). It only interprets what the iPhande database already knows.
