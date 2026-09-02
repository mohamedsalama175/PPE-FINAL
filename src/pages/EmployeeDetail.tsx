import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePPEStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ContainerCard } from '../components/ui/ContainerCard';
import { 
  ArrowLeft, Download, ShieldAlert, Package, Calendar, 
  User, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  Building2, Briefcase, Mail, MapPin, Layers, FileText, 
  ChevronDown, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { Employee, Issuance, IssuanceReturn, PPEItem } from '../types';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  
  const { 
    employees, 
    cachedEmployees, 
    isEmployeeMasterOnline, 
    jobPositions, 
    issuances, 
    issuanceReturns, 
    ppeItems, 
    kits,
    locations
  } = usePPEStore();

  const [activeTab, setActiveTab] = React.useState<'timeline' | 'basicInfo'>('timeline');
  const [visibleCount, setVisibleCount] = React.useState(5);
  const [isExporting, setIsExporting] = React.useState(false);

  // Find employee from live list or fallback cache
  const employee = React.useMemo(() => {
    const list = isEmployeeMasterOnline ? employees : cachedEmployees;
    return list.find(e => e.id === id) || employees.find(e => e.id === id);
  }, [id, employees, cachedEmployees, isEmployeeMasterOnline]);

  // If employee not found
  if (!employee) {
    return (
      <div className="p-8 text-center space-y-4">
        <EmptyState
          icon={<User className="w-8 h-8" />}
          title={language === 'en' ? "Employee not found" : "الموظف غير موجود"}
          description={language === 'en' ? "The requested employee record does not exist or has been removed." : "سجل الموظف غير موجود."}
        />
        <Button variant="secondary" onClick={() => navigate('/employees')}>
          <ArrowLeft className="w-4 h-4 me-2 rtl:rotate-180" />
          {t('employeeDirectory')}
        </Button>
      </div>
    );
  }

  const jobPosition = jobPositions.find(p => p.id === employee.jobPositionId);
  const positionTitle = jobPosition ? (language === 'en' ? jobPosition.nameEn : jobPosition.nameAr) : '—';

  // Get all issuances for this employee, newest first
  const employeeIssuances = React.useMemo(() => {
    return issuances
      .filter(i => i.employeeId === employee.id)
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [issuances, employee.id]);

  const currentlyHeldCount = employeeIssuances.filter(i => i.status === 'issued').length;
  const returnedCount = employeeIssuances.filter(i => i.status === 'returned').length;

  // Map each issuance with its return info and details
  const enrichedIssuances = React.useMemo(() => {
    return employeeIssuances.map(iss => {
      const returnRecord = issuanceReturns.find(r => r.issuanceId === iss.id);
      const ppeItem = iss.ppeItemId ? ppeItems.find(p => p.id === iss.ppeItemId) : null;
      const kit = iss.kitId ? kits.find(k => k.id === iss.kitId) : null;
      const issuer = employees.find(e => e.id === iss.issuedBy);
      const location = locations.find(l => l.id === iss.locationId);

      const isReturned = iss.status === 'returned' || Boolean(returnRecord);
      const isCurrentlyHeld = !isReturned;

      return {
        issuance: iss,
        returnRecord,
        ppeItem,
        kit,
        issuerName: issuer?.name || iss.issuedBy,
        locationName: location?.nameEn || iss.locationId,
        isCurrentlyHeld,
        isReturned
      };
    });
  }, [employeeIssuances, issuanceReturns, ppeItems, kits, employees, locations]);

  // Export to PDF function
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 16;

      // Header Banner
      doc.setFillColor(20, 24, 33); // #141821 Dark slate
      doc.rect(0, 0, pageWidth, 28, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('BITWISE HSE - PPE ISSUANCE & RETURN RECORD', 14, 12);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Official Digital Personnel Safety Log | Generated: ${format(new Date(), 'PPpp')}`, 14, 19);

      y = 36;

      // Employee Information Box
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(220, 224, 230);
      doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(employee.name, 18, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      // Col 1
      doc.text(`Employee ID: ${employee.employeeCode}`, 18, y + 16);
      doc.text(`Job Position: ${positionTitle}`, 18, y + 22);
      doc.text(`Department: ${employee.department || 'N/A'}`, 18, y + 28);

 // Col 2
 const col2 = 80;
 doc.text(`Site: ${employee.site || 'N/A'}`, col2, y + 16);
 doc.text(`Gender: ${employee.gender || 'N/A'}`, col2, y + 22);
 doc.text(`Status: ${employee.status || 'Active'}`, col2, y + 28);

 // Col 3
 const col3 = 140;
 doc.text(`Email: ${employee.email || 'N/A'}`, col3, y + 16);
 doc.text(`Active Items Held: ${currentlyHeldCount}`, col3, y + 22);
 doc.text(`Total Records: ${employeeIssuances.length}`, col3, y + 28);

      y += 46;

      // Issuance Timeline Section Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('PPE Issuance History & Timeline', 14, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('(Chronological order, newest entries first)', 84, y);

      y += 6;

      if (enrichedIssuances.length === 0) {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('No PPE issued yet for this employee.', pageWidth / 2, y + 11, { align: 'center' });
        y += 30;
      } else {
        // Table Header
        const colX = {
          item: 16,
          batch: 74,
          issueDate: 96,
          issuedBy: 116,
          conditionIssue: 138,
          returnStatus: 156,
          expectedReplace: 182
        };

        doc.setFillColor(226, 232, 240);
        doc.rect(14, y, pageWidth - 28, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        doc.text('ITEM NAME', colX.item, y + 5.5);
        doc.text('BATCH', colX.batch, y + 5.5);
        doc.text('ISSUE DATE', colX.issueDate, y + 5.5);
        doc.text('ISSUED BY', colX.issuedBy, y + 5.5);
        doc.text('COND. (ISSUE)', colX.conditionIssue, y + 5.5);
        doc.text('RETURN / STATUS', colX.returnStatus, y + 5.5);
        doc.text('EXP. REPLACE', colX.expectedReplace, y + 5.5);

        y += 8;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        enrichedIssuances.forEach((row, idx) => {
          // Page overflow check
          if (y > 260) {
            doc.addPage();
            y = 16;
            // Repeat Header
            doc.setFillColor(226, 232, 240);
            doc.rect(14, y, pageWidth - 28, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(30, 41, 59);
            doc.text('ITEM NAME', colX.item, y + 5.5);
            doc.text('BATCH', colX.batch, y + 5.5);
            doc.text('ISSUE DATE', colX.issueDate, y + 5.5);
            doc.text('ISSUED BY', colX.issuedBy, y + 5.5);
            doc.text('COND. (ISSUE)', colX.conditionIssue, y + 5.5);
            doc.text('RETURN / STATUS', colX.returnStatus, y + 5.5);
            doc.text('EXP. REPLACE', colX.expectedReplace, y + 5.5);
            y += 8;
            doc.setFont('helvetica', 'normal');
          }

          // Row background alternate
          if (idx % 2 === 0) {
            doc.setFillColor(255, 255, 255);
          } else {
            doc.setFillColor(248, 250, 252);
          }
          doc.rect(14, y, pageWidth - 28, 11, 'F');
          doc.setDrawColor(241, 245, 249);
          doc.line(14, y + 11, pageWidth - 14, y + 11);

          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);

          // Item Name
          const itemName = row.ppeItem 
            ? row.ppeItem.nameEn 
            : (row.kit ? `Kit: ${row.kit.nameEn}` : 'PPE Item');
          const truncatedItem = itemName.length > 28 ? itemName.substring(0, 26) + '...' : itemName;
          doc.text(truncatedItem, colX.item, y + 5);

          // Subtitle Code
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(row.ppeItem?.itemCode || 'Kit', colX.item, y + 9);

          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);

          // Batch
          doc.text(row.issuance.batchNumber || '—', colX.batch, y + 7);

          // Issue Date
          doc.text(format(new Date(row.issuance.issueDate), 'yyyy-MM-dd'), colX.issueDate, y + 7);

          // Issued By
          const truncatedIssuer = row.issuerName.length > 12 ? row.issuerName.substring(0, 10) + '..' : row.issuerName;
          doc.text(truncatedIssuer, colX.issuedBy, y + 7);

          // Condition at Issue
          doc.text(row.issuance.conditionAtIssue || 'New', colX.conditionIssue, y + 7);

          // Return Status / Date
          if (row.isCurrentlyHeld) {
            doc.setTextColor(16, 149, 193); // Teal
            doc.setFont('helvetica', 'bold');
            doc.text('CURRENTLY HELD', colX.returnStatus, y + 7);
            doc.setFont('helvetica', 'normal');
          } else {
            doc.setTextColor(71, 85, 105);
            const returnDateStr = row.returnRecord 
              ? format(new Date(row.returnRecord.returnDate), 'yyyy-MM-dd')
              : 'Returned';
            const cond = row.returnRecord?.condition ? ` (${row.returnRecord.condition.replace('_', ' ')})` : '';
            doc.text(`${returnDateStr}${cond}`, colX.returnStatus, y + 7);
          }

          // Expected Replacement Date
          doc.setTextColor(71, 85, 105);
          const expDate = row.issuance.expectedReplacementDate 
            ? format(new Date(row.issuance.expectedReplacementDate), 'yyyy-MM-dd')
            : '—';
          doc.text(expDate, colX.expectedReplace, y + 7);

          y += 11;
        });
      }

      // Sign-off verification section at the bottom
      if (y > 230) {
        doc.addPage();
        y = 20;
      } else {
        y += 10;
      }

      doc.setDrawColor(203, 213, 225);
      doc.line(14, y, pageWidth - 14, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('VERIFICATION & SIGN-OFF', 14, y);

      y += 14;
      // Signature lines
      doc.setDrawColor(148, 163, 184);
      doc.line(20, y, 75, y);
      doc.line(85, y, 140, y);
      doc.line(150, y, 195, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Employee Signature', 30, y + 4);
      doc.text('HSE Officer / Store Keeper Signature', 90, y + 4);
      doc.text('Date', 168, y + 4);

      // Save PDF
      const sanitizedName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`PPE_Record_${employee.employeeCode}_${sanitizedName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const visibleIssuances = enrichedIssuances.slice(0, visibleCount);
  const hasMore = visibleCount < enrichedIssuances.length;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('employeeDirectory')}</span>
        </button>
        <span className="text-slate-300 ">/</span>
        <span className="text-xs font-semibold text-slate-900 ">{employee.name}</span>
      </div>

      {/* Top Profile Header Card */}
      <ContainerCard className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {employee.photoUrl ? (
              <img 
                src={employee.photoUrl} 
                alt={employee.name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-20 h-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border-2 border-primary/20 ${employee.photoUrl ? 'hidden' : ''}`}>
              {employee.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 ">{employee.name}</h1>
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-semibold">
                  {employee.employeeCode}
                </span>
                {employee.status === 'Active' && <StatusBadge status="success" label={t('activeStatus')} />}
                {employee.status === 'Terminated' && <StatusBadge status="neutral" label={t('terminatedStatus')} />}
                {employee.status === 'Transferred' && <StatusBadge status="warning" label={t('transferredStatus')} />}
                {!isEmployeeMasterOnline && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 ">
                    {t('unverified')}
                  </span>
                )}
              </div>

              <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary shrink-0" />
                <span>{positionTitle}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{employee.site || 'Main Facility'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{employee.department || 'Operations'}</span>
                </div>
                {employee.email && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{employee.email}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics / Snapshot */}
          <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-s border-slate-200 pt-4 md:pt-0 md:ps-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center min-w-[100px] flex-1 md:flex-initial">
              <div className="text-2xl font-bold text-primary">{currentlyHeldCount}</div>
              <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">{t('currentlyHeld')}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center min-w-[100px] flex-1 md:flex-initial">
              <div className="text-2xl font-bold text-slate-900 ">{returnedCount}</div>
              <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">{t('returnDate')}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center min-w-[100px] flex-1 md:flex-initial">
              <div className="text-2xl font-bold text-slate-900 ">{employeeIssuances.length}</div>
              <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">Total History</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-t border-slate-200 mt-6 -mb-6 pt-1">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'timeline' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-600 hover:text-slate-900 '
            }`}
          >
            {t('issuanceTimeline')} ({employeeIssuances.length})
          </button>
          <button
            onClick={() => setActiveTab('basicInfo')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'basicInfo' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-600 hover:text-slate-900 '
            }`}
          >
            {t('basicInfo')}
          </button>
        </div>
      </ContainerCard>

      {/* Tab 1: Issuance Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {/* Action Bar with Export to PDF Button */}
          <ContainerCard className="flex items-center justify-between px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 ">
                PPE Issuance & Return Log
              </h3>
              <p className="text-xs text-slate-600 ">
                Chronological timeline of all PPE equipment issued to or returned by {employee.name}.
              </p>
            </div>
            
            <Button
              variant="primary"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : t('exportPdf')}</span>
            </Button>
          </ContainerCard>

          {/* Timeline Contents */}
          {enrichedIssuances.length === 0 ? (
            <ContainerCard className="p-10">
              <EmptyState
                icon={<Package className="w-8 h-8" />}
                title={t('noPpeIssued')}
                description={
                  language === 'en' 
                    ? "This employee has not received any PPE issuances or kits to date."
                    : "لم يتم إصدار أي معدات حماية شخصية لهذا الموظف حتى الآن."
                }
              />
            </ContainerCard>
          ) : (
            <ContainerCard className="p-6 space-y-6">
              <div className="relative ps-6 sm:ps-8 border-s-2 border-slate-200 space-y-8">
                {visibleIssuances.map((item, idx) => (
                  <div key={item.issuance.id} className="relative group">
                    {/* Timeline bullet dot */}
                    <div className={`absolute -start-[31px] sm:-start-[39px] top-1.5 w-4 h-4 rounded-full border-2 bg-white  transition-transform group-hover:scale-125 ${
                      item.isCurrentlyHeld 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : 'border-slate-400 bg-white '
                    }`} />

                    {/* Timeline Entry Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 hover:border-primary/40 transition-all shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 ">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-white border border-slate-200 text-primary">
                            {item.kit ? <Layers className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 ">
                              {item.ppeItem 
                                ? (language === 'en' ? item.ppeItem.nameEn : item.ppeItem.nameAr) 
                                : (item.kit ? (language === 'en' ? item.kit.nameEn : item.kit.nameAr) : 'PPE Item')}
                            </div>
                            <div className="text-xs text-slate-600 font-mono">
                              {item.ppeItem?.itemCode || 'Kit Item'} • Qty: {item.issuance.quantity}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge: Currently Held vs Returned */}
                        <div>
                          {item.isCurrentlyHeld ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 " />
                              {t('currentlyHeld')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 ">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              Returned on {item.returnRecord ? format(new Date(item.returnRecord.returnDate), 'MMM d, yyyy') : 'Returned'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detail Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">{t('batch')}</span>
                          <span className="font-mono font-medium text-slate-900 ">
                            {item.issuance.batchNumber || '—'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">{t('issueDate')}</span>
                          <span className="font-medium text-slate-900 ">
                            {format(new Date(item.issuance.issueDate), 'MMM d, yyyy')}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">{t('issuedBy')}</span>
                          <span className="font-medium text-slate-900 ">
                            {item.issuerName}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">{t('conditionAtIssue')}</span>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 text-slate-900 ">
                            {item.issuance.conditionAtIssue || 'New'}
                          </span>
                        </div>

                        {/* Return details row */}
                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">{t('returnDate')}</span>
                          <span className="font-medium text-slate-900 ">
                            {item.isCurrentlyHeld ? (
                              <span className="text-emerald-600 font-semibold">{t('currentlyHeld')}</span>
                            ) : (
                              item.returnRecord ? format(new Date(item.returnRecord.returnDate), 'MMM d, yyyy') : '—'
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">{t('conditionAtReturn')}</span>
                          <span className="font-medium text-slate-900 capitalize">
                            {item.returnRecord ? item.returnRecord.condition.replace('_', ' ') : '—'}
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <span className="text-slate-500 block text-[11px] uppercase font-semibold">{t('expectedReplacement')}</span>
                          <span className="font-medium text-slate-900 ">
                            {item.issuance.expectedReplacementDate 
                              ? format(new Date(item.issuance.expectedReplacementDate), 'MMM d, yyyy')
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button for large history */}
              {hasMore && (
                <div className="text-center pt-2 border-t border-slate-200 ">
                  <Button
                    variant="secondary"
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    className="cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4 me-1.5" />
                    <span>{t('loadMore')} ({enrichedIssuances.length - visibleCount} remaining)</span>
                  </Button>
                </div>
              )}
            </ContainerCard>
          )}
        </div>
      )}

      {/* Tab 2: Basic Info */}
      {activeTab === 'basicInfo' && (
        <ContainerCard className="p-6 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              {t('basicInfo')} & Personnel Details
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Read-only Master record synchronized from corporate HR & Employee Master.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Full Name</label>
                <div className="font-medium text-slate-900 mt-1">{employee.name}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('employeeId')}</label>
                <div className="font-mono font-medium text-slate-900 mt-1">{employee.employeeCode}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('jobPosition')}</label>
                <div className="font-medium text-slate-900 mt-1">{positionTitle}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('department')}</label>
                <div className="font-medium text-slate-900 mt-1">{employee.department || '—'}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('site')}</label>
                <div className="font-medium text-slate-900 mt-1">{employee.site || '—'}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('gender')}</label>
                <div className="font-medium text-slate-900 mt-1">{employee.gender || '—'}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('status')}</label>
                <div className="font-medium text-slate-900 mt-1">{employee.status || (employee.active ? 'Active' : 'Terminated')}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('email')}</label>
                <div className="font-medium text-slate-900 mt-1">{employee.email || '—'}</div>
              </div>
            </div>
          </div>
        </ContainerCard>
      )}
    </div>
  );
}
