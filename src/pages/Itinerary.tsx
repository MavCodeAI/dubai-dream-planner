import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentTrip, saveCurrentTrip, saveTrip, canSaveMoreTrips, canExportPDF, upgradeToPro } from '@/lib/storage';
import { regenerateDay } from '@/lib/itinerary-generator';
import { Trip, Activity, DayPlan, EMIRATES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PricingModal } from '@/components/PricingModal';
import {
  Calendar,
  Users,
  DollarSign,
  ChevronDown,
  RefreshCcw,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  MapPin,
  Bookmark,
  Download,
  Pencil,
  Save,
  Share2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MOCK_ACTIVITIES } from '@/data/activities';

export default function Itinerary() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [tripName, setTripName] = useState('');
  const [openDays, setOpenDays] = useState<number[]>([1]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingFeature, setPricingFeature] = useState('');
  
  // Activity dialogs
  const [addActivityDay, setAddActivityDay] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<{ dayNumber: number; activity: Activity } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ dayNumber: number; activityId: string } | null>(null);
  
  // Custom activity form
  const [customActivity, setCustomActivity] = useState({
    name: '',
    timeOfDay: 'morning' as Activity['timeOfDay'],
    durationHours: 2,
    estimatedCostUSD: 50,
  });

  useEffect(() => {
    const currentTrip = getCurrentTrip();
    if (!currentTrip) {
      navigate('/onboarding');
      return;
    }
    setTrip(currentTrip);
    setTripName(currentTrip.name);
    setOpenDays([1]);
  }, [navigate]);

  if (!trip) return null;

  const { onboardingData, days, totalCostUSD } = trip;
  const budgetProgress = (totalCostUSD / onboardingData.budgetUSD) * 100;
  const budgetStatus = budgetProgress < 70 ? 'good' : budgetProgress < 90 ? 'warning' : 'danger';

  const handleSaveName = () => {
    if (tripName.trim()) {
      const updated = { ...trip, name: tripName.trim(), updatedAt: new Date().toISOString() };
      setTrip(updated);
      saveCurrentTrip(updated);
      setEditingName(false);
      toast.success('Trip name updated');
    }
  };

  const handleRegenerateDay = (dayNumber: number) => {
    const updated = regenerateDay(trip, dayNumber);
    setTrip(updated);
    saveCurrentTrip(updated);
    toast.success(`Day ${dayNumber} regenerated!`);
  };

  const handleToggleDay = (dayNumber: number) => {
    setOpenDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber]
    );
  };

  const handleSaveTrip = () => {
    if (!canSaveMoreTrips()) {
      setPricingFeature('save unlimited trips');
      setShowPricingModal(true);
      return;
    }
    saveTrip(trip);
    toast.success('Trip saved to this device.');
  };

  const handleExportPDF = () => {
    if (!canExportPDF()) {
      setPricingFeature('export PDF');
      setShowPricingModal(true);
      return;
    }
    navigate('/print');
  };

  const handleUpgrade = () => {
    upgradeToPro();
    toast.success('Welcome to Pro! Enjoy unlimited features.');
  };

  const handleShareTrip = () => {
    const shareText = `I planned my UAE trip using this tool. Try it here: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText);
    toast.success('Trip link copied to clipboard!');
  };

  const getCityName = (cityId: string) => {
    return EMIRATES.find((e) => e.id === cityId)?.name || cityId;
  };

  const handleAddActivity = (activity: Activity) => {
    if (!addActivityDay) return;
    
    const dayIndex = addActivityDay - 1;
    const updatedDays = [...trip.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      activities: [...updatedDays[dayIndex].activities, activity],
      dailyCostUSD: updatedDays[dayIndex].dailyCostUSD + activity.estimatedCostUSD,
    };

    const updated: Trip = {
      ...trip,
      days: updatedDays,
      totalCostUSD: updatedDays.reduce((sum, d) => sum + d.dailyCostUSD, 0),
      updatedAt: new Date().toISOString(),
    };

    setTrip(updated);
    saveCurrentTrip(updated);
    setAddActivityDay(null);
    toast.success('Activity added!');
  };

  const handleAddCustomActivity = () => {
    if (!addActivityDay || !customActivity.name.trim()) return;
    
    const newActivity: Activity = {
      id: `custom-${Date.now()}`,
      name: customActivity.name,
      city: trip.days[addActivityDay - 1].city,
      description: 'Custom activity',
      durationHours: customActivity.durationHours,
      estimatedCostUSD: customActivity.estimatedCostUSD,
      tags: [],
      timeOfDay: customActivity.timeOfDay,
      familyFriendly: true,
      luxuryLevel: 'mid',
    };

    handleAddActivity(newActivity);
    setCustomActivity({ name: '', timeOfDay: 'morning', durationHours: 2, estimatedCostUSD: 50 });
  };

  const handleEditActivity = () => {
    if (!editingActivity) return;
    
    const { dayNumber, activity } = editingActivity;
    const dayIndex = dayNumber - 1;
    const updatedDays = [...trip.days];
    const activityIndex = updatedDays[dayIndex].activities.findIndex((a) => a.id === activity.id);
    
    if (activityIndex >= 0) {
      updatedDays[dayIndex].activities[activityIndex] = activity;
      updatedDays[dayIndex].dailyCostUSD = updatedDays[dayIndex].activities.reduce(
        (sum, a) => sum + a.estimatedCostUSD,
        0
      );
    }

    const updated: Trip = {
      ...trip,
      days: updatedDays,
      totalCostUSD: updatedDays.reduce((sum, d) => sum + d.dailyCostUSD, 0),
      updatedAt: new Date().toISOString(),
    };

    setTrip(updated);
    saveCurrentTrip(updated);
    setEditingActivity(null);
    toast.success('Activity updated!');
  };

  const handleRemoveActivity = () => {
    if (!deleteConfirm) return;
    
    const { dayNumber, activityId } = deleteConfirm;
    const dayIndex = dayNumber - 1;
    const updatedDays = [...trip.days];
    const activity = updatedDays[dayIndex].activities.find((a) => a.id === activityId);
    
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      activities: updatedDays[dayIndex].activities.filter((a) => a.id !== activityId),
      dailyCostUSD: updatedDays[dayIndex].dailyCostUSD - (activity?.estimatedCostUSD || 0),
    };

    const updated: Trip = {
      ...trip,
      days: updatedDays,
      totalCostUSD: updatedDays.reduce((sum, d) => sum + d.dailyCostUSD, 0),
      updatedAt: new Date().toISOString(),
    };

    setTrip(updated);
    saveCurrentTrip(updated);
    setDeleteConfirm(null);
    toast.success('Activity removed');
  };

  const handleMoveActivity = (dayNumber: number, activityId: string, direction: 'up' | 'down') => {
    const dayIndex = dayNumber - 1;
    const updatedDays = [...trip.days];
    const activities = [...updatedDays[dayIndex].activities];
    const activityIndex = activities.findIndex((a) => a.id === activityId);
    
    if (
      (direction === 'up' && activityIndex === 0) ||
      (direction === 'down' && activityIndex === activities.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? activityIndex - 1 : activityIndex + 1;
    [activities[activityIndex], activities[newIndex]] = [activities[newIndex], activities[activityIndex]];

    updatedDays[dayIndex] = { ...updatedDays[dayIndex], activities };

    const updated: Trip = { ...trip, days: updatedDays, updatedAt: new Date().toISOString() };
    setTrip(updated);
    saveCurrentTrip(updated);
  };

  const availableActivitiesForDay = (dayNumber: number) => {
    const day = trip.days[dayNumber - 1];
    const usedIds = new Set(day.activities.map((a) => a.id));
    return MOCK_ACTIVITIES.filter((a) => a.city === day.city && !usedIds.has(a.id));
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Confirmation message */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <p className="text-green-800 font-medium">
            Your trip plan is ready. You can edit, save, or export it.
          </p>
        </div>

        {/* Header */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-lg">
          {/* Trip name */}
          <div className="mb-4">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="text-xl font-bold"
                  autoFocus
                />
                <Button size="icon" onClick={handleSaveName}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-navy">{trip.name}</h1>
                <Button variant="ghost" size="icon" onClick={() => setEditingName(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Trip info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm">
                {format(parseISO(onboardingData.startDate), 'MMM d')} -{' '}
                {format(parseISO(onboardingData.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm">
                {onboardingData.adults} adults, {onboardingData.children} children
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm">{onboardingData.cities.length} cities</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm">${onboardingData.budgetUSD.toLocaleString()} budget</span>
            </div>
          </div>

          {/* Budget progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Budget Used</span>
              <span
                className={cn(
                  "text-sm font-bold",
                  budgetStatus === 'good' && "text-green-600",
                  budgetStatus === 'warning' && "text-yellow-600",
                  budgetStatus === 'danger' && "text-red-600"
                )}
              >
                ${totalCostUSD.toLocaleString()} / ${onboardingData.budgetUSD.toLocaleString()}
              </span>
            </div>
            <Progress
              value={Math.min(budgetProgress, 100)}
              className={cn(
                "h-3",
                budgetStatus === 'good' && "[&>div]:bg-green-500",
                budgetStatus === 'warning' && "[&>div]:bg-yellow-500",
                budgetStatus === 'danger' && "[&>div]:bg-red-500"
              )}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSaveTrip} className="gap-2">
              <Bookmark className="w-4 h-4" />
              Save Trip
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleShareTrip} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share Trip
            </Button>
          </div>
        </div>

        {/* Day cards */}
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            You can edit anything — this is just a starting plan
          </div>
          {days.map((day) => (
            <DayCard
              key={day.dayNumber}
              day={day}
              isOpen={openDays.includes(day.dayNumber)}
              onToggle={() => handleToggleDay(day.dayNumber)}
              onRegenerate={() => handleRegenerateDay(day.dayNumber)}
              onAddActivity={() => setAddActivityDay(day.dayNumber)}
              onEditActivity={(activity) => setEditingActivity({ dayNumber: day.dayNumber, activity })}
              onRemoveActivity={(activityId) => setDeleteConfirm({ dayNumber: day.dayNumber, activityId })}
              onMoveActivity={(activityId, direction) => handleMoveActivity(day.dayNumber, activityId, direction)}
              getCityName={getCityName}
            />
          ))}
        </div>
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={addActivityDay !== null} onOpenChange={() => setAddActivityDay(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Add Activity - Day {addActivityDay}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Available activities */}
            <div>
              <h4 className="font-medium mb-3">Available Activities</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {addActivityDay && availableActivitiesForDay(addActivityDay).map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => handleAddActivity(activity)}
                    className="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{activity.name}</span>
                      <span className="text-primary font-semibold text-sm">${activity.estimatedCostUSD}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {activity.durationHours}h • {activity.timeOfDay}
                    </div>
                  </button>
                ))}
                {addActivityDay && availableActivitiesForDay(addActivityDay).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No more activities available for this city
                  </p>
                )}
              </div>
            </div>

            {/* Custom activity */}
            <div>
              <h4 className="font-medium mb-3">Or Add Custom Activity</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Activity name"
                  value={customActivity.name}
                  onChange={(e) => setCustomActivity({ ...customActivity, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Duration (hours)</label>
                    <Input
                      type="number"
                      value={customActivity.durationHours}
                      onChange={(e) => setCustomActivity({ ...customActivity, durationHours: Number(e.target.value) })}
                      min={0.5}
                      max={12}
                      step={0.5}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Cost (USD)</label>
                    <Input
                      type="number"
                      value={customActivity.estimatedCostUSD}
                      onChange={(e) => setCustomActivity({ ...customActivity, estimatedCostUSD: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                </div>
                <Button onClick={handleAddCustomActivity} disabled={!customActivity.name.trim()} className="w-full">
                  Add Custom Activity
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={editingActivity !== null} onOpenChange={() => setEditingActivity(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          {editingActivity && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  value={editingActivity.activity.name}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Duration (hours)</label>
                  <Input
                    type="number"
                    value={editingActivity.activity.durationHours}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, durationHours: Number(e.target.value) },
                      })
                    }
                    min={0.5}
                    max={12}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cost (USD)</label>
                  <Input
                    type="number"
                    value={editingActivity.activity.estimatedCostUSD}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, estimatedCostUSD: Number(e.target.value) },
                      })
                    }
                    min={0}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingActivity(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditActivity}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the activity from your itinerary. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveActivity} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onUpgrade={handleUpgrade}
        feature={pricingFeature}
      />
    </div>
  );
}

// Day Card Component
interface DayCardProps {
  day: DayPlan;
  isOpen: boolean;
  onToggle: () => void;
  onRegenerate: () => void;
  onAddActivity: () => void;
  onEditActivity: (activity: Activity) => void;
  onRemoveActivity: (activityId: string) => void;
  onMoveActivity: (activityId: string, direction: 'up' | 'down') => void;
  getCityName: (cityId: string) => string;
}

function DayCard({
  day,
  isOpen,
  onToggle,
  onRegenerate,
  onAddActivity,
  onEditActivity,
  onRemoveActivity,
  onMoveActivity,
  getCityName,
}: DayCardProps) {
  const timeSlotColors = {
    morning: 'bg-yellow-100 text-yellow-800',
    afternoon: 'bg-orange-100 text-orange-800',
    evening: 'bg-indigo-100 text-indigo-800',
    anytime: 'bg-gray-100 text-gray-800',
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-md">
        <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-primary-foreground font-bold">
              {day.dayNumber}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-navy">
                Day {day.dayNumber} - {getCityName(day.city)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(day.date), 'EEEE, MMMM d, yyyy')} • {day.activities.length} activities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-primary font-semibold">${day.dailyCostUSD}</span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5 border-t border-border">
            {/* Actions */}
            <div className="flex gap-2 py-4">
              <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1">
                <RefreshCcw className="w-3 h-3" />
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={onAddActivity} className="gap-1">
                <Plus className="w-3 h-3" />
                Add Activity
              </Button>
            </div>

            {/* Activities */}
            <div className="space-y-3">
              {day.activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  No activities planned. Add some activities!
                </p>
              ) : (
                day.activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => onMoveActivity(activity.id, 'up')}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {index + 1}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === day.activities.length - 1}
                        onClick={() => onMoveActivity(activity.id, 'down')}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{activity.name}</h4>
                        <span className="text-primary font-semibold">${activity.estimatedCostUSD}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            timeSlotColors[activity.timeOfDay]
                          )}
                        >
                          {activity.timeOfDay}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.durationHours}h
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditActivity(activity)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemoveActivity(activity.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
