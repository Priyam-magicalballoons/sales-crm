import React, { useEffect, useState } from "react";
// import { useAuth } from "@/context/AuthContext";
import { Search, Bell, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AddClientModal from "@/components/crm/AddClientModal";
import { getCurrentUser } from "@/lib/helpers";
import { User } from "@/types/crm";

const Header: React.FC = () => {
  // const { user } = useAuth();
  const [showAddClient, setShowAddClient] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>();

  const getUser = async () => {
    const data = await getCurrentUser();
    data && setCurrentUser(data);
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <>
      <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
        <div className="">
          <h1 className="text-xl font-bold">Sales Pipeline</h1>
          <p className="text-md text-muted-foreground">
            Manage your deals and track progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddClient(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Button>

          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </Button> */}

          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {currentUser ? currentUser?.name.split("")[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <AddClientModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
      />
    </>
  );
};

export default Header;
